"use server"

import dbConnect from "@/lib/mongodb"
import User from "@/model/User"
import { revalidatePath } from "next/cache"
import mongoose from "mongoose"
import axios from "axios"

// Paystack API configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const PAYSTACK_BASE_URL = "https://api.paystack.co"

// Paystack API client
const paystackClient = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
})

// Enhanced safe serializer
const safeSerialize = (data) => {
  const seen = new WeakSet()

  const serialize = (value) => {
    if (value === null || typeof value !== "object") return value
    if (seen.has(value)) return "[Circular]"
    seen.add(value)

    if (value instanceof Date) return value.toISOString()
    if (value instanceof mongoose.Types.ObjectId) return value.toString()
    if (value.$__ != null) value = value.toObject()
    if (Array.isArray(value)) return value.map((item) => serialize(item))
    if (value instanceof Buffer) return value.toString("base64")

    const result = {}
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        result[key] = serialize(value[key])
      }
    }
    return result
  }

  try {
    return JSON.parse(JSON.stringify(serialize(data)))
  } catch (error) {
    console.error("Serialization error:", error)
    return null
  }
}

// Create Paystack recipient
const createPaystackRecipient = async (bankDetails, userName) => {
  try {
    const response = await paystackClient.post("/transferrecipient", {
      type: "nuban",
      name: bankDetails.accountName || userName,
      account_number: bankDetails.accountNumber,
      bank_code: bankDetails.bankCode,
      currency: "NGN",
    })

    return {
      success: true,
      recipientCode: response.data.data.recipient_code,
    }
  } catch (error) {
    console.error("Paystack recipient creation error:", error.response?.data || error.message)
    return {
      success: false,
      message: error.response?.data?.message || "Failed to create recipient",
    }
  }
}

// Initiate Paystack transfer with OTP handling
const initiatePaystackTransfer = async (recipientCode, amount, reason, reference) => {
  try {
    const amountInKobo = Math.round(amount * 100)

    const response = await paystackClient.post("/transfer", {
      source: "balance",
      reason: reason,
      amount: amountInKobo,
      recipient: recipientCode,
      reference: reference,
    })

    // Check if OTP is required
    if (response.data.data.requires_otp) {
      return {
        success: true,
        status: "otp_required",
        reference: response.data.data.reference,
        transferCode: response.data.data.transfer_code,
        message: "OTP required to complete transfer",
      }
    }

    if (!response.data.data || !response.data.data.reference) {
      return {
        success: false,
        message: "Invalid response from Paystack",
        reference: undefined,
      }
    }

    return {
      success: true,
      status: response.data.data.status,
      reference: response.data.data.reference,
      transferCode: response.data.data.transfer_code,
      amount: amount,
    }
  } catch (error) {
    console.error("Paystack transfer error:", error.response?.data || error.message)

    let errorMessage = "Failed to initiate transfer"
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    }

    return {
      success: false,
      message: errorMessage,
      reference: undefined,
    }
  }
}

// Submit OTP for transfer
const submitTransferOTP = async (transferCode, otp) => {
  try {
    const response = await paystackClient.post("/transfer/finalize_transfer", {
      transfer_code: transferCode,
      otp: otp,
    })

    if (response.data.data.status === "success") {
      return {
        success: true,
        status: "success",
        data: { reference: response.data.data.reference },
        message: "Transfer completed successfully",
      }
    } else {
      return {
        success: false,
        message: response.data.data.message || "OTP verification failed",
        status: response.data.data.status,
      }
    }
  } catch (error) {
    console.error("OTP submission error:", error.response?.data || error.message)

    let errorMessage = "Failed to submit OTP"
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    }

    return {
      success: false,
      message: errorMessage,
    }
  }
}

// Check transfer status
const checkPaystackTransferStatus = async (reference) => {
  try {
    const response = await paystackClient.get(`/transfer/verify/${reference}`)
    return {
      success: true,
      status: response.data.data.status,
      data: response.data.data,
    }
  } catch (error) {
    console.error("Paystack status check error:", error.response?.data || error.message)
    return {
      success: false,
      message: error.response?.data?.message || "Failed to check transfer status",
    }
  }
}

// Resend OTP via Paystack
const resendPaystackOTP = async (transferCode) => {
  try {
    const response = await paystackClient.post("/transfer/resend_otp", {
      transfer_code: transferCode,
      reason: "transfer", // Changed from "resend_otp" to "transfer" to fix the error
    })

    if (response.data.status && response.data.data.status === "success") {
      return {
        success: true,
        message: "OTP resent successfully",
      }
    } else {
      return {
        success: false,
        message: response.data.message || "Failed to resend OTP",
      }
    }
  } catch (error) {
    console.error("Paystack OTP resend error:", error.response?.data || error.message)
    return {
      success: false,
      message: error.response?.data?.message || "Failed to resend OTP",
    }
  }
}

export const getPayoutRequests = async ({ 
  page = 1, 
  limit = 10, 
  status = "", 
  search = "", 
  paymentStatus = "",
  startDate = null,
  endDate = null
}) => {
  try {
    await dbConnect()

    const skip = (page - 1) * limit

    const baseMatch = {
      "referralProgram.payoutHistory": { $exists: true, $ne: [] },
    }

    const statusMatch = status ? { "referralProgram.payoutHistory.status": status } : {}
    const paymentStatusMatch = paymentStatus ? { "referralProgram.payoutHistory.paymentStatus": paymentStatus } : {}

    let searchMatch = {}
    if (search) {
      searchMatch = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { "referralProgram.bankDetails.accountName": { $regex: search, $options: "i" } },
          { "referralProgram.bankDetails.accountNumber": { $regex: search, $options: "i" } },
        ],
      }
    }

    // Add date range filter if provided
    let dateMatch = {}
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      // Set to start and end of day in UTC
      start.setUTCHours(0, 0, 0, 0)
      end.setUTCHours(23, 59, 59, 999)
      
      dateMatch = {
        "referralProgram.payoutHistory.requestedAt": {
          $gte: start,
          $lte: end
        }
      }
    }

    const countPipeline = [
      { $match: baseMatch },
      ...(search ? [{ $match: searchMatch }] : []),
      { $unwind: "$referralProgram.payoutHistory" },
      ...(status ? [{ $match: statusMatch }] : []),
      ...(paymentStatus ? [{ $match: paymentStatusMatch }] : []),
      ...(startDate && endDate ? [{ $match: dateMatch }] : []),
      { $count: "total" },
    ]

    const countResult = await User.aggregate(countPipeline)
    const total = countResult[0]?.total || 0

    const users = await User.aggregate([
      { $match: baseMatch },
      ...(search ? [{ $match: searchMatch }] : []),
      { $unwind: "$referralProgram.payoutHistory" },
      ...(status ? [{ $match: statusMatch }] : []),
      ...(paymentStatus ? [{ $match: paymentStatusMatch }] : []),
      ...(startDate && endDate ? [{ $match: dateMatch }] : []),
      { $sort: { "referralProgram.payoutHistory.requestedAt": -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          name: 1,
          email: 1,
          bankDetails: "$referralProgram.bankDetails",
          payout: "$referralProgram.payoutHistory",
          _id: 1,
          paystackRecipientCode: "$referralProgram.paystackRecipientCode",
        },
      },
    ])

    const serializedPayouts = users.map((user) => ({
      ...user,
      _id: user._id.toString(),
      payout: {
        ...user.payout,
        _id: user.payout._id.toString(),
        requestedAt: user.payout.requestedAt.toISOString(),
        ...(user.payout.processedAt && { processedAt: user.payout.processedAt.toISOString() }),
        ...(user.payout.completedAt && { completedAt: user.payout.completedAt.toISOString() }),
        ...(user.payout.lastAttempt && { lastAttempt: user.payout.lastAttempt.toISOString() }),
      },
      bankDetails: user.bankDetails
        ? {
            ...user.bankDetails,
            ...(user.bankDetails._id && { _id: user.bankDetails._id.toString() }),
          }
        : null,
    }))

    return {
      success: true,
      data: {
        payouts: serializedPayouts,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    }
  } catch (error) {
    console.error("Error fetching payout requests:", error)
    return {
      success: false,
      message: "Failed to fetch payout requests",
      error: error.message,
    }
  }
}

export const markManualTransferComplete = async (userId, payoutId, reference) => {
  try {
    await dbConnect()

    // Find the user and the specific payout
    const user = await User.findById(userId)
    if (!user) {
      return {
        success: false,
        message: "User not found"
      }
    }

    // Find the payout in the payoutHistory array
    const payout = user.referralProgram.payoutHistory.id(payoutId)
    if (!payout) {
      return {
        success: false,
        message: "Payout not found"
      }
    }

    // ✅ Update the payout itself
    payout.status = "completed"
    payout.paymentStatus = "success"
    payout.paystackReference = reference
    payout.processedAt = new Date()

    // ✅ Update all completedReferrals with paymentRequest = true and status = completed
    let updatedCount = 0
    user.referralProgram.completedReferrals.forEach(referral => {
      if (
        referral.paymentRequest === true &&
        referral.status === "completed" &&
        referral.paymentStatus !== "success"
      ) {
        referral.paymentStatus = "success"
        updatedCount++
      }
    })

    await user.save()

    return {
      success: true,
      message: `Transfer marked as completed successfully. Updated ${updatedCount} referrals.`,
      data: {
        payoutId: payout._id.toString(),
        status: payout.status,
        paymentStatus: payout.paymentStatus,
        paystackReference: payout.paystackReference,
        updatedReferrals: updatedCount
      }
    }
  } catch (error) {
    console.error("Error marking manual transfer complete:", error)
    return {
      success: false,
      message: "Failed to mark transfer as complete",
      error: error.message,
    }
  }
}

// Update payout status
export const updatePayoutStatus = async (userId, payoutId, status) => {
  try {
    await dbConnect()

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(payoutId)) {
      return {
        success: false,
        message: "Invalid user or payout ID",
        data: null,
      }
    }

    const validStatuses = ["pending", "processing", "completed", "failed", "cancelled"]
    if (!validStatuses.includes(status)) {
      return {
        success: false,
        message: "Invalid status value",
        data: null,
      }
    }

    const user = await User.findOne({
      _id: userId,
      "referralProgram.payoutHistory._id": payoutId,
    })

    if (!user) {
      return {
        success: false,
        message: "Payout request not found",
        data: null,
      }
    }

    const payout = user.referralProgram.payoutHistory.find((p) => p._id.equals(payoutId))

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: userId,
        "referralProgram.payoutHistory._id": payoutId,
      },
      {
        $set: {
          "referralProgram.payoutHistory.$.status": status,
          "referralProgram.payoutHistory.$.processedAt": new Date(),
          ...(status === "failed" && {
            "referralProgram.payoutHistory.$.paymentStatus": "failed",
          }),
        },
      },
      { new: true },
    ).lean()

    if (status === "completed") {
      await User.updateMany(
        {
          _id: userId,
          "referralProgram.completedReferrals.status": "pending",
          "referralProgram.completedReferrals.paymentStatus": "processing",
        },
        {
          $set: {
            "referralProgram.completedReferrals.$[elem].status": "completed",
            "referralProgram.completedReferrals.$[elem].paymentStatus": "paid",
            "referralProgram.completedReferrals.$[elem].paidAt": new Date(),
          },
        },
        {
          arrayFilters: [
            {
              "elem.status": "pending",
              "elem.paymentStatus": "processing",
            },
          ],
        },
      )
    }

    revalidatePath("/admin/payouts")
    return {
      success: true,
      message: `Payout ${status} successfully`,
      data: {
        user: {
          _id: updatedUser._id.toString(),
          name: updatedUser.name,
          email: updatedUser.email,
        },
        payout: {
          ...safeSerialize(payout),
          _id: payout._id.toString(),
          status,
          processedAt: new Date().toISOString(),
        },
      },
    }
  } catch (error) {
    console.error("Error updating payout status:", error)
    return {
      success: false,
      message: "Failed to update payout status",
      error: error.message,
      data: null,
    }
  }
}

// Initiate payout transfer
export const initiatePayoutTransfer = async (userId, payoutId) => {
  try {
    await dbConnect()

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(payoutId)) {
      return {
        success: false,
        message: "Invalid user or payout ID",
        data: null,
      }
    }

    const user = await User.findOne({
      _id: userId,
      "referralProgram.payoutHistory._id": payoutId,
    })

    if (!user) {
      return {
        success: false,
        message: "User or payout not found",
        data: null,
      }
    }

    const payout = user.referralProgram.payoutHistory.find((p) => p._id.equals(payoutId))

    if (!payout) {
      return {
        success: false,
        message: "Payout not found",
        data: null,
      }
    }

    // Check if payout is already completed or processing
    if (payout.status === "completed" && payout.paymentStatus === "success") {
      return {
        success: false,
        message: "Payout has already been completed",
      }
    }

    if (payout.status === "otp" || payout.paymentStatus === "processing") {
      return {
        success: false,
        message: "Payout is already being processed",
      }
    }

    if (!user.referralProgram.bankDetails) {
      return {
        success: false,
        message: "User bank details not found",
      }
    }

    // Create recipient if not exists
    let recipientCode = user.referralProgram.paystackRecipientCode
    if (!recipientCode) {
      const recipientResult = await createPaystackRecipient(user.referralProgram.bankDetails, user.name)

      if (!recipientResult.success) {
        return {
          success: false,
          message: recipientResult.message,
        }
      }

      recipientCode = recipientResult.recipientCode

      // Save recipient code to user
      await User.findByIdAndUpdate(userId, {
        "referralProgram.paystackRecipientCode": recipientCode,
      })
    }

    // Initiate transfer
    const transferResult = await initiatePaystackTransfer(
      recipientCode,
      payout.amount,
      `Payout for ${user.name}`,
      `payout_${payoutId}_${Date.now()}`,
    )

    if (!transferResult.success) {
      return {
        success: false,
        message: transferResult.message,
      }
    }

    // Update payout status
    const updateData = {
      "referralProgram.payoutHistory.$.status": transferResult.status === "otp_required" ? "otp" : "processing",
      "referralProgram.payoutHistory.$.paymentStatus": "processing",
      "referralProgram.payoutHistory.$.paystackReference": transferResult.reference,
      "referralProgram.payoutHistory.$.transferCode": transferResult.transferCode,
      "referralProgram.payoutHistory.$.lastAttempt": new Date(),
    }

    await User.updateOne(
      {
        _id: userId,
        "referralProgram.payoutHistory._id": payoutId,
      },
      { $set: updateData },
    )

    revalidatePath("/admin/payouts")
    return {
      success: true,
      message: transferResult.message || "Transfer initiated successfully",
      data: {
        requiresOtp: transferResult.status === "otp_required",
        reference: transferResult.reference,
      },
    }
  } catch (error) {
    console.error("Error initiating transfer:", error)
    return {
      success: false,
      message: "Failed to initiate transfer",
      error: error.message,
    }
  }
}

// Submit OTP for payout
export const submitPayoutOTP = async (userId, payoutId, otp) => {
  try {
    await dbConnect()

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(payoutId)) {
      return {
        success: false,
        message: "Invalid user or payout ID",
        data: null,
      }
    }

    const user = await User.findOne({
      _id: userId,
      "referralProgram.payoutHistory._id": payoutId,
    })

    if (!user) {
      return {
        success: false,
        message: "Payout not found",
        data: null,
      }
    }

    const payout = user.referralProgram.payoutHistory.find((p) => p._id.equals(payoutId))

    // Check if payout is in OTP state
    if (payout.status !== "otp" && payout.status !== "otp_required") {
      return {
        success: false,
        message: `Payout is not in OTP state. Current status: ${payout.status}`,
      }
    }

    if (!payout.transferCode) {
      return {
        success: false,
        message: "No transfer code found for OTP submission",
      }
    }

    // Submit OTP to Paystack
    const otpResult = await submitTransferOTP(payout.transferCode, otp)

    if (!otpResult.success) {
      return {
        success: false,
        message: otpResult.message,
      }
    }

    // Update payout status based on OTP result
    const updateData = {
      "referralProgram.payoutHistory.$.status": otpResult.status === "success" ? "completed" : "failed",
      "referralProgram.payoutHistory.$.paymentStatus": otpResult.status === "success" ? "success" : "failed",
      "referralProgram.payoutHistory.$.lastAttempt": new Date(),
    }

    if (otpResult.status === "success") {
      updateData["referralProgram.payoutHistory.$.completedAt"] = new Date()
    }

    await User.updateOne(
      {
        _id: userId,
        "referralProgram.payoutHistory._id": payoutId,
      },
      { $set: updateData },
    )

    revalidatePath("/admin/payouts")
    return {
      success: true,
      message: otpResult.message || "OTP verified successfully",
      data: {
        status: otpResult.status,
      },
    }
  } catch (error) {
    console.error("Error submitting OTP:", error)
    return {
      success: false,
      message: "Failed to submit OTP",
      error: error.message,
    }
  }
}

// Check payout status
export const checkPayoutStatus = async (userId, payoutId) => {
  try {
    await dbConnect()

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(payoutId)) {
      return {
        success: false,
        message: "Invalid user or payout ID",
        data: null,
      }
    }

    const user = await User.findOne({
      _id: userId,
      "referralProgram.payoutHistory._id": payoutId,
    })

    if (!user) {
      return {
        success: false,
        message: "Payout request not found",
        data: null,
      }
    }

    const payout = user.referralProgram.payoutHistory.find((p) => p._id.equals(payoutId))

    if (!payout) {
      return {
        success: false,
        message: "Payout not found",
        data: null,
      }
    }

    // Check if we have a Paystack reference
    if (!payout.paystackReference) {
      return {
        success: false,
        message: "No Paystack reference found for this payout",
        data: null,
      }
    }

    // Check Paystack transfer status
    const statusResult = await checkPaystackTransferStatus(payout.paystackReference)

    if (!statusResult.success) {
      // If reference is invalid, mark as failed
      if (statusResult.message?.includes("invalid") || statusResult.message?.includes("not found")) {
        await User.updateOne(
          {
            _id: userId,
            "referralProgram.payoutHistory._id": payoutId,
          },
          {
            $set: {
              "referralProgram.payoutHistory.$.status": "failed",
              "referralProgram.payoutHistory.$.paymentStatus": "failed",
              "referralProgram.payoutHistory.$.error":
                "Invalid Paystack reference - transfer may not have been created",
              "referralProgram.payoutHistory.$.lastAttempt": new Date(),
            },
          }
        )

        return {
          success: false,
          message: "Invalid Paystack reference. The transfer may not have been created successfully.",
          data: null,
        }
      }

      return {
        success: false,
        message: statusResult.message,
        data: null,
      }
    }

    // Update payout status based on Paystack response
    let updateData = {}
    if (statusResult.status === "success") {
      updateData = {
        "referralProgram.payoutHistory.$.status": "completed",
        "referralProgram.payoutHistory.$.paymentStatus": "success",
        "referralProgram.payoutHistory.$.completedAt": new Date(),
      }
    } else if (statusResult.status === "failed") {
      updateData = {
        "referralProgram.payoutHistory.$.status": "failed",
        "referralProgram.payoutHistory.$.paymentStatus": "failed",
        "referralProgram.payoutHistory.$.lastAttempt": new Date(),
      }
    } else {
      updateData = {
        "referralProgram.payoutHistory.$.status": "processing",
        "referralProgram.payoutHistory.$.paymentStatus": "processing",
        "referralProgram.payoutHistory.$.lastAttempt": new Date(),
      }
    }

    await User.updateOne(
      {
        _id: userId,
        "referralProgram.payoutHistory._id": payoutId,
      },
      { $set: updateData }
    )

    revalidatePath("/admin/payouts")
    return {
      success: true,
      message: `Transfer status: ${statusResult.status}`,
      data: {
        status: statusResult.status,
        details: statusResult.data,
      },
    }
  } catch (error) {
    console.error("Error checking payout status:", error)
    return {
      success: false,
      message: "Failed to check payout status",
      error: error.message,
      data: null,
    }
  }
}

// Retry failed payout
export const retryFailedPayout = async (payoutId) => {
  try {
    await dbConnect()

    if (!mongoose.Types.ObjectId.isValid(payoutId)) {
      return {
        success: false,
        message: "Invalid payout ID",
        data: null,
      }
    }

    const user = await User.findOne({
      "referralProgram.payoutHistory._id": payoutId,
      "referralProgram.payoutHistory.status": "failed",
    })

    if (!user) {
      return {
        success: false,
        message: "Payout not found or not in failed status",
        data: null,
      }
    }

    const payout = user.referralProgram.payoutHistory.find((p) => p._id.toString() === payoutId)

    if (!payout) {
      return {
        success: false,
        message: "Payout not found",
        data: null,
      }
    }

    await User.updateOne(
      {
        _id: user._id,
        "referralProgram.payoutHistory._id": payoutId,
      },
      {
        $set: {
          "referralProgram.payoutHistory.$.status": "pending",
          "referralProgram.payoutHistory.$.paymentStatus": "pending",
          "referralProgram.payoutHistory.$.lastAttempt": new Date(),
        },
      }
    )

    revalidatePath("/admin/payouts")
    return {
      success: true,
      message: "Payout marked for retry. Please initiate the transfer again.",
      data: {
        payoutId: payoutId,
        status: "pending",
      },
    }
  } catch (error) {
    console.error("Error retrying failed payout:", error)
    return {
      success: false,
      message: "An error occurred while retrying payout",
      error: error.message,
      data: null,
    }
  }
}

// Resend OTP for payout
export const resendPayoutOTP = async (userId, payoutId) => {
  try {
    await dbConnect()

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(payoutId)) {
      return {
        success: false,
        message: "Invalid user or payout ID",
        data: null,
      }
    }

    const user = await User.findOne({
      _id: userId,
      "referralProgram.payoutHistory._id": payoutId,
    })

    if (!user) {
      return {
        success: false,
        message: "Payout not found",
        data: null,
      }
    }

    const payout = user.referralProgram.payoutHistory.find((p) => p._id.equals(payoutId))

    // Allow OTP resend for both OTP states AND processing state (in case OTP is still needed)
    const allowedStatuses = ["otp", "otp_required", "processing"]
    if (!allowedStatuses.includes(payout.status)) {
      return {
        success: false,
        message: `Payout is not in a state that allows OTP resend. Current status: ${payout.status}`,
      }
    }

    // Check if we have a transfer code
    if (!payout.transferCode) {
      // If no transfer code but we have a Paystack reference, try to get the transfer code
      if (payout.paystackReference) {
        try {
          // Fetch transfer details from Paystack to get the transfer code
          const transferDetails = await paystackClient.get(`/transfer/verify/${payout.paystackReference}`)

          if (transferDetails.data && transferDetails.data.data && transferDetails.data.data.transfer_code) {
            // Update the payout with the transfer code
            await User.updateOne(
              {
                _id: userId,
                "referralProgram.payoutHistory._id": payoutId,
              },
              {
                $set: {
                  "referralProgram.payoutHistory.$.transferCode": transferDetails.data.data.transfer_code,
                  "referralProgram.payoutHistory.$.lastAttempt": new Date(),
                },
              }
            )

            // Use the retrieved transfer code
            payout.transferCode = transferDetails.data.data.transfer_code
          }
        } catch (error) {
          console.error("Error fetching transfer details:", error.response?.data || error.message)
          // Continue to the error handling below
        }
      }

      // If we still don't have a transfer code after trying to retrieve it
      if (!payout.transferCode) {
        return {
          success: false,
          message: "No transfer code found for OTP resend. Please initiate a new transfer.",
        }
      }
    }

    // Resend OTP via Paystack
    const otpResult = await resendPaystackOTP(payout.transferCode)

    if (!otpResult.success) {
      return {
        success: false,
        message: otpResult.message,
      }
    }

    // Update last attempt timestamp
    await User.updateOne(
      {
        _id: userId,
        "referralProgram.payoutHistory._id": payoutId,
      },
      {
        $set: {
          "referralProgram.payoutHistory.$.lastAttempt": new Date(),
        },
      }
    )

    revalidatePath("/admin/payouts")
    return {
      success: true,
      message: otpResult.message || "OTP resent successfully",
    }
  } catch (error) {
    console.error("Error resending OTP:", error)
    return {
      success: false,
      message: "Failed to resend OTP",
      error: error.message,
    }
  }
}