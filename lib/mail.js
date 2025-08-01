import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GOOGLE_EMAIL_USERNAME,
    pass: process.env.GOOGLE_EMAIL_PASSWORD,
  },
});

// Helper function to get the base URL with proper formatting
function getBaseUrl() {
  const baseUrl =  process.env.NEXTAUTH_URL;
  // Remove trailing slash if present
  return baseUrl.replace(/\/+$/, '');
}

// Helper function to safely build URLs with parameters
function buildUrl(path, params = {}) {
  const baseUrl = getBaseUrl();
  const url = new URL(path, baseUrl);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.append(key, value);
  });
  
  return url.toString();
}

export const sendVerificationEmail = async (email, token) => {
  const baseUrl = getBaseUrl();
  const confirmLink = buildUrl('/auth/new-verification', { token });
  const logoUrl = "https://res.cloudinary.com/djr7uqara/image/upload/v1753889584/simy5xzhfzlxxpdpgvlg.png";

  const mailOptions = {
    from: `wayaKart <${process.env.GOOGLE_EMAIL_USERNAME}>`,
    to: email,
    subject: "Verify Your wayaKart Account",
    text: `Welcome to wayaKart! Please verify your email by clicking this link: ${confirmLink}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="
          margin: 0;
          padding: 0;
          font-family: 'Helvetica', 'Arial', sans-serif;
          background-color: #f4f4f4;
          color: #333;
        ">
          <table width="100%" cellpadding="0" cellspacing="0" style="
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            border-top: 5px solid #2563eb;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
          ">
            <!-- Header -->
            <tr>
              <td style="padding: 30px 0; text-align: center; background: linear-gradient(to right, #1e40af, #3b82f6);">
                <img src="${logoUrl}" alt="wayaKart" style="max-width: 200px; height: auto;">
              </td>
            </tr>

            <!-- Main Content -->
            <tr>
              <td style="padding: 30px 40px;">
                <h1 style="margin: 0 0 20px; color: #2563eb; font-size: 24px;">Welcome to wayaKart!</h1>
                <p style="font-size: 16px; margin-bottom: 20px;">Thank you for signing up. To start your journey with us, please verify your email by clicking the button below.</p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${confirmLink}" style="
                    display: inline-block;
                    padding: 12px 30px;
                    background: linear-gradient(to right, #2563eb, #3b82f6);
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 4px;
                    font-weight: bold;
                    font-size: 16px;
                  ">Verify My Email</a>
                </div>

                <p style="font-size: 14px; color: #888;">If the button doesn't work, copy and paste the following link into your browser:</p>
                <p style="font-size: 14px; color: #888; word-break: break-word;">
                  <a href="${confirmLink}" style="color: #2563eb;">${confirmLink}</a>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="
                padding: 20px 40px;
                background-color: #f8fafc;
                text-align: center;
                font-size: 14px;
                color: #666;
              ">
                <p style="margin: 0 0 10px;">
                  <strong style="color: #2563eb;">wayaKart</strong><br>
                  Your trusted online shopping destination
                </p>
                <p style="margin: 0;">
                  <a href="mailto:wayakart27@gmail.com" style="color: #2563eb; text-decoration: none;">wayakart27@gmail.com</a>
                </p>
                <p style="margin: 10px 0 0; font-size: 12px;">
                  © ${new Date().getFullYear()} wayaKart. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);;
    return { 
      success: true,
      message: "Verification email sent successfully",
      email: email
    };
  } catch (error) {
    console.error("Error sending verification email to:", email, error);
    return { 
      success: false, 
      error: "Failed to send verification email",
      details: error.message,
      email: email
    };
  }
};

export const sendPasswordResetEmail = async (email, token) => {
  const baseUrl = getBaseUrl();
  const resetLink = buildUrl('/auth/new-password', { token });
  const logoUrl = "https://res.cloudinary.com/djr7uqara/image/upload/v1753701144/aoidtp9ppabder0dvxxm.png";

  const mailOptions = {
    from: `wayaKart <${process.env.GOOGLE_EMAIL_USERNAME}>`,
    to: email,
    subject: "Reset Your wayaKart Password",
    text: `You requested a password reset. Please click this link to reset your password: ${resetLink}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Request</title>
        </head>
        <body style="
          margin: 0;
          padding: 0;
          font-family: 'Helvetica', 'Arial', sans-serif;
          background-color: #f4f4f4;
          color: #333;
        ">
          <table width="100%" cellpadding="0" cellspacing="0" style="
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            border-top: 5px solid #2563eb;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
          ">
            <!-- Header -->
            <tr>
              <td style="padding: 30px 0; text-align: center; background: linear-gradient(to right, #1e40af, #3b82f6);">
                <img src="${logoUrl}" alt="wayaKart" style="max-width: 200px; height: auto;">
              </td>
            </tr>

            <!-- Main Content -->
            <tr>
              <td style="padding: 30px 40px;">
                <h1 style="margin: 0 0 20px; color: #2563eb; font-size: 24px;">Password Reset Request</h1>
                <p style="font-size: 16px; margin-bottom: 20px;">We received a request to reset your password. Click the button below to set a new password. This link will expire in 1 hour.</p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetLink}" style="
                    display: inline-block;
                    padding: 12px 30px;
                    background: linear-gradient(to right, #2563eb, #3b82f6);
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 4px;
                    font-weight: bold;
                    font-size: 16px;
                  ">Reset My Password</a>
                </div>

                <p style="font-size: 14px; color: #888;">If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
                <p style="font-size: 14px; color: #888;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="font-size: 14px; color: #888; word-break: break-word;">
                  <a href="${resetLink}" style="color: #2563eb;">${resetLink}</a>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="
                padding: 20px 40px;
                background-color: #f8fafc;
                text-align: center;
                font-size: 14px;
                color: #666;
              ">
                <p style="margin: 0 0 10px;">
                  <strong style="color: #2563eb;">wayaKart</strong><br>
                  Your trusted online shopping destination
                </p>
                <p style="margin: 0;">
                  <a href="mailto:support@wayakart.com" style="color: #2563eb; text-decoration: none;">support@wayakart.com</a>
                </p>
                <p style="margin: 10px 0 0; font-size: 12px;">
                  © ${new Date().getFullYear()} wayaKart. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { 
      success: true,
      message: "Password reset email sent successfully",
      email: email
    };
  } catch (error) {
    console.error("Error sending password reset email to:", email, error);
    return { 
      success: false, 
      error: "Failed to send password reset email",
      details: error.message,
      email: email
    };
  }
};

export const sendTwoFactorEmail = async (email, token) => {
  const baseUrl = getBaseUrl();
  const logoUrl = "https://res.cloudinary.com/djr7uqara/image/upload/v1753701144/aoidtp9ppabder0dvxxm.png";

  const mailOptions = {
    from: `wayaKart <${process.env.GOOGLE_EMAIL_USERNAME}>`,
    to: email,
    subject: "Your Two-Factor Authentication Code",
    text: `Your verification code is: ${token}\nThis code will expire in 5 minutes.`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Two-Factor Authentication</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Helvetica', 'Arial', sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
            <!-- Header -->
            <tr>
              <td style="padding: 30px 0; text-align: center; background: linear-gradient(to right, #1e40af, #3b82f6);">
                <img src="${logoUrl}" alt="wayaKart" style="max-width: 200px; height: auto;">
              </td>
            </tr>

            <!-- Main Content -->
            <tr>
              <td style="padding: 30px 40px; background-color: #ffffff;">
                <h1 style="margin: 0 0 20px; color: #2563eb; font-size: 24px; text-align: center;">
                  Two-Factor Authentication Code
                </h1>
                
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; text-align: center;">
                  <p style="margin-bottom: 15px; font-size: 16px;">
                    Enter this code to complete your login:
                  </p>
                  <div style="
                    display: inline-block;
                    padding: 15px 25px;
                    background-color: #fff;
                    color: #2563eb;
                    font-size: 28px;
                    font-weight: bold;
                    letter-spacing: 3px;
                    border: 2px solid #2563eb;
                    border-radius: 6px;
                    margin: 10px 0;
                  ">${token}</div>
                  <p style="font-size: 14px; color: #666;">
                    <strong>Expires in:</strong> 5 minutes
                  </p>
                </div>

                <p style="font-size: 14px; color: #777; margin-top: 25px;">
                  If you didn't request this code, please secure your account immediately.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px 40px; background-color: #f8fafc; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #888;">
                  © ${new Date().getFullYear()} wayaKart. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { 
      success: true,
      message: "2FA code sent successfully",
      email: email,
      code: token
    };
  } catch (error) {
    console.error("Error sending 2FA email to:", email, error);
    return { 
      success: false, 
      error: "Failed to send 2FA email",
      details: error.message,
      email: email
    };
  }
};

export const sendOrderStatusEmail = async (email, orderId, oldStatus, newStatus) => {
  const baseUrl = getBaseUrl();
  const logoUrl = "https://res.cloudinary.com/djr7uqara/image/upload/v1753701144/aoidtp9ppabder0dvxxm.png";
  const orderLink = buildUrl(`/dashboard/my-order/${orderId}`);

  const statusMessages = {
    pending: "is being prepared",
    processing: "is now being processed",
    shipped: "has been shipped",
    delivered: "has been delivered",
    cancelled: "has been cancelled",
    refunded: "has been refunded"
  };

  const statusColors = {
    pending: "#FFA500", // Orange
    processing: "#4169E1", // Royal Blue
    shipped: "#1E90FF", // Dodger Blue
    delivered: "#32CD32", // Lime Green
    cancelled: "#FF0000", // Red
    refunded: "#9370DB" // Medium Purple
  };

  const mailOptions = {
    from: `wayaKart <${process.env.GOOGLE_EMAIL_USERNAME}>`,
    to: email,
    subject: `Order #${orderId} Status Update: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Status Update</title>
          <style>
            @media only screen and (max-width: 600px) {
              .responsive-table {
                width: 100% !important;
              }
              .responsive-padding {
                padding: 20px 15px !important;
              }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Helvetica', 'Arial', sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
            <!-- Header -->
            <tr>
              <td style="padding: 30px 0; text-align: center; background: linear-gradient(to right, #1e40af, #3b82f6);">
                <img src="${logoUrl}" alt="wayaKart" style="max-width: 200px; height: auto;">
              </td>
            </tr>

            <!-- Main Content -->
            <tr>
              <td style="padding: 30px 40px; background-color: #ffffff;" class="responsive-padding">
                <h1 style="margin: 0 0 20px; color: #2563eb; font-size: 24px; text-align: center;">
                  Your Order Status Has Changed
                </h1>
                
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid ${statusColors[newStatus] || '#2563eb'};">
                  <p style="margin-bottom: 10px; font-size: 16px;">
                    <strong>Order #:</strong> ${orderId}
                  </p>
                  <p style="margin-bottom: 10px; font-size: 16px;">
                    <strong>Previous Status:</strong> ${oldStatus.charAt(0).toUpperCase() + oldStatus.slice(1)}
                  </p>
                  <p style="margin-bottom: 15px; font-size: 16px;">
                    <strong>New Status:</strong> 
                    <span style="color: ${statusColors[newStatus] || '#2563eb'}; font-weight: bold;">
                      ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}
                    </span>
                  </p>
                  
                  <p style="font-size: 16px; margin: 20px 0 10px;">
                    Your order ${statusMessages[newStatus] || 'status has been updated'}.
                  </p>
                  
                  <div style="text-align: center; margin-top: 20px;">
                    <a href="${orderLink}" style="
                      display: inline-block;
                      padding: 12px 24px;
                      background: linear-gradient(to right, #2563eb, #3b82f6);
                      color: white;
                      text-decoration: none;
                      border-radius: 4px;
                      font-weight: bold;
                      font-size: 16px;
                    ">View Order Details</a>
                  </div>
                </div>

                <p style="font-size: 14px; color: #777; margin-top: 25px;">
                  If you have any questions about your order, please reply to this email or contact our 
                  <a href="mailto:support@wayakart.com" style="color: #2563eb;">support team</a>.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px 40px; background-color: #f8fafc; text-align: center;" class="responsive-padding">
                <p style="margin: 0; font-size: 12px; color: #888;">
                  © ${new Date().getFullYear()} wayaKart. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { 
      success: true,
      message: "Order status email sent successfully",
      email: email,
      orderId: orderId
    };
  } catch (error) {
    console.error("Error sending order status email to:", email, error);
    return { 
      success: false, 
      error: "Failed to send order status email",
      details: error.message,
      email: email,
      orderId: orderId
    };
  }
};

export const sendNewArrivalsEmail = async (email, name, products) => {
  const baseUrl = getBaseUrl();
  const logoUrl = "https://res.cloudinary.com/djr7uqara/image/upload/v1753701144/aoidtp9ppabder0dvxxm.png";
  const shopUrl = buildUrl('/');
  
  // Format price in Naira
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Generate HTML for products
  const productsHtml = products.map(product => `
    <div style="margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="100" valign="top">
            <img 
              src="${product.image ? product.image.startsWith('http') ? product.image : `${baseUrl}${product.image}` : `${baseUrl}/placeholder.png`}" 
              alt="${product.name}" 
              style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;"
            >
          </td>
          <td style="padding-left: 20px;" valign="top">
            <h3 style="margin: 0 0 5px; color: #2563eb;">${product.name}</h3>
            <p style="margin: 0 0 8px; color: #666; font-size: 14px;">
              ${product.category || 'Product'}
            </p>
            <p style="margin: 0 0 8px; color: #333;">
              ${product.description ? product.description.substring(0, 100) + (product.description.length > 100 ? '...' : '') : 'A quality product'}
            </p>
            <p style="margin: 0; font-weight: bold; color: #222;">
              ${formatPrice(product.price || 0)}
            </p>
          </td>
        </tr>
      </table>
    </div>
  `).join('');

  const mailOptions = {
    from: `wayaKart <${process.env.GOOGLE_EMAIL_USERNAME}>`,
    to: email,
    subject: "New Arrivals You'll Love!",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Arrivals at wayaKart</title>
          <style>
            @media only screen and (max-width: 600px) {
              .responsive-table {
                width: 100% !important;
              }
              .responsive-padding {
                padding: 20px 15px !important;
              }
              .product-image {
                width: 60px !important;
                height: 60px !important;
              }
              .product-details {
                padding-left: 10px !important;
              }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Helvetica', 'Arial', sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
            <!-- Header -->
            <tr>
              <td style="padding: 30px 0; text-align: center; background: linear-gradient(to right, #1e40af, #3b82f6);">
                <img src="${logoUrl}" alt="wayaKart" style="max-width: 200px; height: auto;">
              </td>
            </tr>

            <!-- Main Content -->
            <tr>
              <td style="padding: 30px 40px; background-color: #ffffff;" class="responsive-padding">
                <h1 style="margin: 0 0 20px; color: #2563eb; font-size: 24px;">
                  Hello ${name || 'Valued Customer'},
                </h1>
                
                <p style="font-size: 16px; line-height: 1.6;">
                  We're excited to share our latest arrivals with you! These new products 
                  have just been added to our collection and we think you'll love them.
                </p>

                <h2 style="color: #2563eb; font-size: 20px; margin: 30px 0 15px;">
                  New Arrivals
                </h2>
                
                ${productsHtml || '<p>Check out our latest products in store!</p>'}

                <div style="text-align: center; margin-top: 30px;">
                  <a href="${shopUrl}" 
                    style="
                      display: inline-block;
                      padding: 12px 30px;
                      background: linear-gradient(to right, #2563eb, #3b82f6);
                      color: white;
                      text-decoration: none;
                      font-weight: bold;
                      border-radius: 4px;
                      font-size: 16px;
                    ">
                    Shop Now
                  </a>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px 40px; background-color: #f8fafc; text-align: center;" class="responsive-padding">
                <p style="margin: 0; font-size: 12px; color: #888;">
                  © ${new Date().getFullYear()} wayaKart. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { 
      success: true,
      message: "New arrivals email sent successfully",
      email: email,
      productsCount: products ? products.length : 0
    };
  } catch (error) {
    console.error("Error sending new arrivals email to:", email, error);
    return { 
      success: false, 
      error: "Failed to send new arrivals email",
      details: error.message,
      email: email
    };
  }
};