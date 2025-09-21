// actions/referrals.js
"use server";

import mongoose from "mongoose";
import User from "@/model/User";
import ReferralPayoutSettings from "@/model/ReferralPayoutSettings";
import dbConnect from "@/lib/mongodb";
import { revalidatePath } from "next/cache";

// Utility Functions ======================================================

const formatNaira = (amount) => {
  try {
    const value = typeof amount === "number" ? amount : parseFloat(amount) || 0;
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  } catch (error) {
    console.error("Formatting error:", error);
    return "₦0.00";
  }
};

const ensureSettingsExist = async () => {
  try {
    let settings = await ReferralPayoutSettings.findOne();
    if (!settings) {
      settings = await ReferralPayoutSettings.create({});
      console.log("Created default referral settings");
    }
    return settings;
  } catch (error) {
    console.error("Error ensuring settings exist:", error);
    throw error;
  }
};

const safeSerialize = (data) => {
  const seen = new WeakSet();

  const serialize = (value) => {
    if (value === null || typeof value !== "object") return value;
    if (seen.has(value)) return "[Circular]";
    seen.add(value);

    if (value instanceof mongoose.Types.ObjectId) return value.toString();
    if (value instanceof mongoose.Document) return serialize(value.toObject());
    if (Buffer.isBuffer(value)) return value.toString("base64");
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map(serialize);

    const result = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        result[key] = serialize(value[key]);
      }
    }
    return result;
  };

  try {
    return JSON.parse(JSON.stringify(serialize(data)));
  } catch (error) {
    console.error("Serialization error:", error);
    return null;
  }
};

const getPayoutSettings = async () => {
  try {
    let settings = await ReferralPayoutSettings.findOne();
    if (!settings) {
      settings = await ReferralPayoutSettings.create({});
      console.log("Created default payout settings");
    }
    return settings;
  } catch (error) {
    console.error("Error getting payout settings:", error);
    throw new Error("Failed to initialize payout settings");
  }
};

// Core Actions ===========================================================

export const getReferralData = async (userId) => {
  try {
    await dbConnect();
    const settings = await ensureSettingsExist();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { success: false, message: "Invalid user ID" };
    }

    const [user, referralStats] = await Promise.all([
      User.findById(userId)
        .select("name email referralProgram")
        .populate({
          path: "referralProgram.pendingReferrals.referee",
          select: "name email createdAt",
          options: { strictPopulate: false }
        })
        .populate({
          path: "referralProgram.completedReferrals.referee",
          select: "name email",
          options: { strictPopulate: false }
        })
        .lean(),
      User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(userId) } },
        {
          $unwind: {
            path: "$referralProgram.completedReferrals",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: null,
            totalEarned: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $eq: [
                          "$referralProgram.completedReferrals.status",
                          "completed",
                        ],
                      },
                      {
                        $eq: [
                          "$referralProgram.completedReferrals.paymentStatus",
                          "success",
                        ],
                      },
                      {
                        $eq: [
                          "$referralProgram.completedReferrals.paymentRequest",
                          true,
                        ],
                      },
                    ],
                  },
                  {
                    $ifNull: ["$referralProgram.completedReferrals.amount", 0],
                  },
                  0,
                ],
              },
            },
            pendingEarnings: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $eq: [
                          "$referralProgram.completedReferrals.status",
                          "pending",
                        ],
                      },
                      {
                        $eq: [
                          "$referralProgram.completedReferrals.paymentStatus",
                          "pending",
                        ],
                      },
                      {
                        $eq: [
                          "$referralProgram.completedReferrals.paymentRequest",
                          false,
                        ],
                      },
                    ],
                  },
                  {
                    $ifNull: ["$referralProgram.completedReferrals.amount", 0],
                  },
                  0,
                ],
              },
            },
            totalCompleted: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$referralProgram.completedReferrals.status",
                      "completed",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            totalPending: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$referralProgram.completedReferrals.status",
                      "pending",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    if (!user) {
      return { success: false, message: "User not found" };
    }

    const referralProgram = user.referralProgram || {};

    // Process pending and completed referrals
    const pendingReferrals = (referralProgram.pendingReferrals || []).map(
      (ref) => ({
        ...safeSerialize(ref),
        referee: ref.referee ? safeSerialize(ref.referee) : null,
        date: ref.date?.toISOString() || new Date().toISOString(),
      })
    );

    const completedReferrals = (referralProgram.completedReferrals || []).map(
      (ref) => ({
        ...safeSerialize(ref),
        referee: ref.referee ? safeSerialize(ref.referee) : null,
        amount: ref.amount || 0,
        date: ref.date?.toISOString() || new Date().toISOString(),
      })
    );

    return {
      success: true,
      data: {
        ...safeSerialize(referralProgram),
        pendingReferrals,
        completedReferrals,
        stats: {
          totalEarned: referralStats[0]?.totalEarned || 0,
          pendingEarnings: referralStats[0]?.pendingEarnings || 0,
          totalCompleted: referralStats[0]?.totalCompleted || 0,
          totalPending: referralStats[0]?.totalPending || 0,
          minPayoutAmount: settings.minPayoutAmount,
          referralPercentage: settings.referralPercentage,
        },
        referralLink: `${process.env.NEXTAUTH_URL}/auth/register?ref=${
          referralProgram.referralCode || ""
        }`,
      },
      message: "Referral data retrieved successfully",
    };
  } catch (error) {
    console.error("Get referral data error:", error);
    return {
      success: false,
      message: "Failed to retrieve referral data",
      error: error.message,
    };
  }
};


export const getReferralList = async ({
  userId,
  type = "pending",
  page = 1,
  limit = 10,
  sort = "-date",
}) => {
  try {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { success: false, message: "Invalid user ID" };
    }

    const validTypes = ["pending", "completed"];
    if (!validTypes.includes(type)) {
      return { success: false, message: "Invalid referral type" };
    }

    page = Math.max(1, parseInt(page) || 1);
    limit = Math.max(1, Math.min(100, parseInt(limit) || 10));

    const user = await User.findById(userId)
      .select(`referralProgram.${type}Referrals`)
      .populate({
        path: `referralProgram.${type}Referrals.referee`,
        select: "name email image createdAt",
      })
      .populate({
        path: `referralProgram.${type}Referrals.order`,
        select: "orderId totalPrice",
        match: { orderId: { $exists: true } },
      })
      .lean();

    if (!user) {
      return { success: false, message: "User not found" };
    }

    const referrals = user.referralProgram?.[`${type}Referrals`] || [];
    const total = referrals.length;

    const sortFn = (a, b) => {
      const aDate = a.date || new Date(0);
      const bDate = b.date || new Date(0);
      const aAmount = a.amount || 0;
      const bAmount = b.amount || 0;

      switch (sort) {
        case "-date":
          return bDate - aDate;
        case "date":
          return aDate - bDate;
        case "-amount":
          return bAmount - aAmount;
        case "amount":
          return aAmount - bAmount;
        default:
          return bDate - aDate;
      }
    };

    const paginatedReferrals = [...referrals]
      .sort(sortFn)
      .slice((page - 1) * limit, page * limit);

    const transformedData = paginatedReferrals.map((referral) => {
      const referee = referral.referee || {};
      const order = referral.order || {};
      const date = referral.date || new Date();

      return {
        _id: referral._id?.toString(),
        referee: {
          id: referee._id?.toString() || "",
          name: referee.name || "Unknown",
          email: referee.email || "",
          image: referee.image || "/placeholder.svg",
          joinDate: referee.createdAt?.toISOString() || null,
        },
        date: date.toISOString(),
        formattedDate: date.toLocaleDateString(),
        amount: referral.amount || 0,
        formattedAmount: formatNaira(referral.amount || 0),
        order: order.orderId
          ? {
              id: order._id?.toString(),
              orderId: order.orderId,
              totalPrice: order.totalPrice || 0,
              formattedTotal: formatNaira(order.totalPrice || 0),
            }
          : null,
        hasPurchased: referral.hasPurchased || false,
        status: referral.status || "pending",
      };
    });

    return {
      success: true,
      data: transformedData,
      total,
      page,
      pages: Math.ceil(total / limit),
      message: `${type} referrals retrieved successfully`,
    };
  } catch (error) {
    console.error("Get referral list error:", error);
    return {
      success: false,
      message: `Failed to retrieve ${type} referrals`,
      error: error.message,
    };
  }
};

// export const getPayoutHistory = async ({
//   userId,
//   page = 1,
//   limit = 10,
//   status = "",
//   sort = "-requestedAt",
// }) => {
//   try {
//     await dbConnect();

//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return { success: false, message: "Invalid user ID" };
//     }

//     page = Math.max(1, parseInt(page) || 1);
//     limit = Math.max(1, Math.min(100, parseInt(limit) || 10));
//     const validStatuses = ["pending", "completed", "failed", ""];
//     if (!validStatuses.includes(status)) {
//       return { success: false, message: "Invalid status filter" };
//     }

//     const user = await User.findById(userId)
//       .select("referralProgram.payoutHistory")
//       .lean();

//     if (!user) {
//       return { success: false, message: "User not found" };
//     }

//     let payouts = user.referralProgram?.payoutHistory || [];

//     if (status) {
//       payouts = payouts.filter(p => p.status === status);
//     }

//     const total = payouts.length;

//     const sortFn = (a, b) => {
//       const aDate = a.requestedAt || new Date(0);
//       const bDate = b.requestedAt || new Date(0);
//       const aAmount = a.amount || 0;
//       const bAmount = b.amount || 0;

//       switch (sort) {
//         case "-requestedAt": return bDate - aDate;
//         case "requestedAt": return aDate - bDate;
//         case "-amount": return bAmount - aAmount;
//         case "amount": return aAmount - bAmount;
//         default: return bDate - aDate;
//       }
//     };

//     const paginatedPayouts = [...payouts]
//       .sort(sortFn)
//       .slice((page - 1) * limit, page * limit);

//     const transformedData = paginatedPayouts.map((payout) => {
//       const requestedAt = payout.requestedAt || new Date();
//       const processedAt = payout.processedAt || null;

//       return {
//         _id: payout._id?.toString(),
//         amount: payout.amount || 0,
//         formattedAmount: formatNaira(payout.amount || 0),
//         requestedAt: requestedAt.toISOString(),
//         formattedRequestDate: requestedAt.toLocaleDateString(),
//         processedAt: processedAt?.toISOString() || null,
//         formattedProcessedDate: processedAt?.toLocaleDateString() || null,
//         status: payout.status || "pending",
//         paystackReference: payout.paystackReference || null,
//       };
//     });

//     return {
//       success: true,
//       data: transformedData,
//       total,
//       page,
//       pages: Math.ceil(total / limit),
//       message: "Payout history retrieved successfully",
//     };
//   } catch (error) {
//     console.error("Get payout history error:", error);
//     return {
//       success: false,
//       message: "Failed to retrieve payout history",
//       error: error.message
//     };
//   }
// };

export const updateBankDetails = async (userId, bankDetails) => {
  try {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { success: false, message: "Invalid user ID" };
    }

    if (!bankDetails?.accountNumber || !bankDetails?.bankCode) {
      return {
        success: false,
        message: "Account number and bank code are required",
      };
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return { success: false, message: "Payment provider not configured" };
    }

    const verificationResponse = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(
        bankDetails.accountNumber
      )}&bank_code=${encodeURIComponent(bankDetails.bankCode)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const verificationData = await verificationResponse.json();

    if (!verificationData.status) {
      console.error(
        `Paystack verification failed: ${verificationData.message}`
      );
      return {
        success: false,
        message: verificationData.message || "Account verification failed",
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "referralProgram.bankDetails": {
            accountName: verificationData.data.account_name,
            accountNumber: bankDetails.accountNumber,
            bankCode: bankDetails.bankCode,
            verified: true,
            lastVerified: new Date(),
          },
        },
      },
      { new: true, select: "referralProgram.bankDetails" }
    );

    if (!updatedUser) {
      return { success: false, message: "User not found" };
    }

    return {
      success: true,
      data: safeSerialize(updatedUser.referralProgram.bankDetails),
      message: "Bank details updated and verified successfully",
    };
  } catch (error) {
    console.error("Update bank details error:", error);
    return {
      success: false,
      message: error.message || "Failed to update bank details",
    };
  }
};

export const updateReferralSettings = async ({
  minPayoutAmount,
  referralPercentage,
}) => {
  try {
    await dbConnect();

    if (typeof minPayoutAmount !== "number" || minPayoutAmount < 10000) {
      return {
        success: false,
        message: "Minimum payout must be at least ₦100",
      };
    }
    if (
      typeof referralPercentage !== "number" ||
      referralPercentage < 0 ||
      referralPercentage > 100
    ) {
      return {
        success: false,
        message: "Referral percentage must be between 0-100%",
      };
    }

    const settings = await ReferralPayoutSettings.findOneAndUpdate(
      {},
      { minPayoutAmount, referralPercentage },
      { upsert: true, new: true, runValidators: true }
    );

    await User.updateMany(
      {},
      { $set: { "referralProgram.minPayoutAmount": settings._id } }
    );

    revalidatePath("/admin/referrals");
    return {
      success: true,
      data: {
        minPayoutAmount: settings.minPayoutAmount,
        referralPercentage: settings.referralPercentage,
      },
      message: "Referral settings updated successfully",
    };
  } catch (error) {
    console.error("Update referral settings error:", error);
    return {
      success: false,
      message: "Failed to update referral settings",
      error: error.message,
    };
  }
};

export const requestPayout = async (userId) => {
  try {
    await dbConnect();
    const settings = await getPayoutSettings();

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { success: false, message: "Invalid user ID" };
    }

    // Get user with necessary referral data including bank details
    const user = await User.findById(userId)
      .select(
        "referralProgram.bankDetails referralProgram.minPayoutAmount referralProgram.completedReferrals referralProgram.payoutHistory"
      )
      .populate({
        path: "referralProgram.minPayoutAmount",
        select: "minPayoutAmount",
      })
      .lean();

    if (!user) {
      return { success: false, message: "User not found" };
    }

    const { referralProgram } = user;

    const hasPendingPayouts = referralProgram.payoutHistory?.some(
      (payout) =>
        payout.status === "pending" ||
        payout.paymentStatus === "pending" ||
        payout.paymentStatus === "processing"
    );

    const hasPendingReferrals = referralProgram.completedReferrals?.some(
      (referral) =>
        referral.paymentStatus === "processing" ||
        (referral.status === "completed" &&
          referral.paymentStatus === "pending")
    );

    if (hasPendingPayouts || hasPendingReferrals) {
      const pendingCount =
        (referralProgram.payoutHistory?.filter(
          (payout) =>
            payout.status === "pending" ||
            payout.paymentStatus === "pending" ||
            payout.paymentStatus === "processing"
        ).length || 0) +
        (referralProgram.completedReferrals?.filter(
          (referral) =>
            referral.paymentStatus === "processing" ||
            (referral.status === "completed" &&
              referral.paymentStatus === "pending")
        ).length || 0);

      return {
        success: false,
        message: `You have ${pendingCount} pending payment${
          pendingCount > 1 ? "s" : ""
        } awaiting approval. Please wait for approval before requesting another payout.`,
        hasPendingPayments: true,
        pendingCount,
      };
    }

    // Check bank details
    if (!referralProgram.bankDetails?.accountNumber) {
      return { success: false, message: "Bank details not set up" };
    }

    // Verify bank details are complete
    if (
      !referralProgram.bankDetails.accountName ||
      !referralProgram.bankDetails.bankCode
    ) {
      return { success: false, message: "Bank details incomplete" };
    }

    // Determine minimum payout amount
    const minPayout =
      referralProgram.minPayoutAmount?.minPayoutAmount ||
      settings.minPayoutAmount;

    // Calculate eligible payout amount from completedReferrals
    const eligibleReferrals =
      referralProgram.completedReferrals?.filter(
        (referral) =>
          referral.status === "pending" &&
          referral.paymentStatus === "pending" &&
          referral.paymentRequest === false
      ) || [];

    const payoutAmount = eligibleReferrals.reduce(
      (sum, referral) => sum + (referral.amount || 0),
      0
    );

    // Validate minimum payout
    if (payoutAmount < minPayout) {
      return {
        success: false,
        message: `Minimum payout amount is ${formatNaira(
          minPayout
        )}. You have ${formatNaira(payoutAmount)} eligible for payout.`,
      };
    }

    // Create payout record with bank details
    const payoutRecord = {
      amount: payoutAmount,
      requestedAt: new Date(),
      status: "pending",
      paymentStatus: "pending",
      bankDetails: {
        accountName: referralProgram.bankDetails.accountName,
        accountNumber: referralProgram.bankDetails.accountNumber,
        bankCode: referralProgram.bankDetails.bankCode,
        verified: referralProgram.bankDetails.verified || false,
      },
    };

    // Update operation - mark these referrals as processing
    const updateOperations = {
      $push: { "referralProgram.payoutHistory": payoutRecord },
      $set: {
        "referralProgram.completedReferrals.$[elem].status": "completed",
        "referralProgram.completedReferrals.$[elem].paymentStatus":
          "processing",
        "referralProgram.completedReferrals.$[elem].paymentRequest": true,
      },
    };

    const options = {
      arrayFilters: [
        {
          "elem.status": "pending",
          "elem.paymentStatus": "pending",
          "elem.paymentRequest": false,
        },
      ],
      new: true,
    };

    // Execute the update
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateOperations,
      options
    ).lean();

    if (!updatedUser) {
      throw new Error("Failed to update user record");
    }

    return {
      success: true,
      data: {
        amount: payoutAmount,
        formattedAmount: formatNaira(payoutAmount),
        status: "pending",
        paymentStatus: "processing",
        bankDetails: payoutRecord.bankDetails,
        updatedReferralsCount: eligibleReferrals.length,
      },
      message: "Payout request submitted successfully",
    };
  } catch (error) {
    console.error("Request payout error:", error);
    return {
      success: false,
      message: error.message || "Failed to request payout",
    };
  }
};

export const repairDatabaseReferences = async () => {
  try {
    await dbConnect();
    const settings = await getPayoutSettings();

    const result = await User.updateMany(
      {
        $or: [
          { "referralProgram.minPayoutAmount": { $exists: false } },
          {
            "referralProgram.minPayoutAmount": { $type: ["number", "string"] },
          },
          {
            "referralProgram.minPayoutAmount": { $not: { $type: "objectId" } },
          },
        ],
      },
      { $set: { "referralProgram.minPayoutAmount": settings._id } }
    );

    return {
      success: true,
      message: `Fixed ${result.modifiedCount} broken references`,
      count: result.modifiedCount,
    };
  } catch (error) {
    console.error("Repair error:", error);
    return {
      success: false,
      message: "Failed to repair references",
      error: error.message,
    };
  }
};

export const getPayoutHistory = async ({
  userId,
  page = 1,
  limit = 10,
  status = "",
  sort = "-requestedAt",
}) => {
  try {
    await dbConnect();

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { success: false, message: "Invalid user ID" };
    }

    page = Math.max(1, parseInt(page));
    limit = Math.max(1, Math.min(100, parseInt(limit) || 10));

    const validStatuses = ["pending", "processing", "completed", "failed", ""];
    if (!validStatuses.includes(status)) {
      return { success: false, message: "Invalid status filter" };
    }

    const validSortFields = ["requestedAt", "amount", "processedAt"];
    const sortDirection = sort.startsWith("-") ? -1 : 1;
    const sortField = sort.replace(/^-/, "");

    if (!validSortFields.includes(sortField)) {
      return { success: false, message: "Invalid sort parameter" };
    }

    // Use aggregation pipeline for better performance
    const pipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      {
        $project: {
          payoutHistory: {
            $ifNull: ["$referralProgram.payoutHistory", []],
          },
        },
      },
      { $unwind: "$payoutHistory" },
    ];

    // Add status filter if provided
    if (status) {
      pipeline.push({
        $match: {
          "payoutHistory.status": status,
        },
      });
    }

    // Add sorting
    pipeline.push({
      $sort: {
        [`payoutHistory.${sortField}`]: sortDirection,
      },
    });

    // Add pagination
    pipeline.push(
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $group: {
          _id: null,
          payouts: { $push: "$payoutHistory" },
          total: { $sum: 1 },
        },
      }
    );

    // Get total count separately for accurate pagination
    const countPipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      {
        $project: {
          payoutHistory: {
            $ifNull: ["$referralProgram.payoutHistory", []],
          },
        },
      },
      { $unwind: "$payoutHistory" },
    ];

    if (status) {
      countPipeline.push({
        $match: {
          "payoutHistory.status": status,
        },
      });
    }

    countPipeline.push({ $count: "total" });

    const [result, countResult] = await Promise.all([
      User.aggregate(pipeline),
      User.aggregate(countPipeline),
    ]);

    const total = countResult[0]?.total || 0;
    const payouts = result[0]?.payouts || [];

    // Transform data
    const transformedData = payouts.map((payout) => ({
      _id: payout._id?.toString(),
      amount: payout.amount || 0,
      formattedAmount: formatNaira(payout.amount || 0),
      requestedAt:
        payout.requestedAt?.toISOString() || new Date().toISOString(),
      formattedRequestDate: formatDate(payout.requestedAt),
      processedAt: payout.processedAt?.toISOString() || null,
      formattedProcessedDate: payout.processedAt
        ? formatDate(payout.processedAt)
        : null,
      status: payout.status || "pending",
      paystackReference: payout.paystackReference || null,
      paymentStatus: payout.paymentStatus,
      bankDetails: payout.bankDetails,
    }));

    return {
      success: true,
      data: transformedData,
      total,
      page,
      pages: Math.ceil(total / limit),
      message: "Payout history retrieved successfully",
    };
  } catch (error) {
    console.error("Get payout history error:", error);
    return {
      success: false,
      message: "Failed to retrieve payout history",
      error: error.message,
    };
  }
};

// Helper function for consistent date formatting
function formatDate(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const getReferralSettings = async () => {
  try {
    await dbConnect();

    let settings = await ReferralPayoutSettings.findOne();
    if (!settings) {
      settings = await ReferralPayoutSettings.create({});
    }

    return {
      success: true,
      data: {
        minPayoutAmount: settings.minPayoutAmount,
        referralPercentage: settings.referralPercentage,
      },
    };
  } catch (error) {
    console.error("Error fetching referral settings:", error);
    return {
      success: false,
      message: "Failed to load referral settings",
      error: error.message,
    };
  }
};
