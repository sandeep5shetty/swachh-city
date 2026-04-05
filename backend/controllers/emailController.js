import nodemailer from "nodemailer";
import Truck from "../models/truckModel.js";

function createTransporter() {
    const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD } = process.env;

    if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASSWORD) {
        throw new Error(
            "Email configuration missing. Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD in backend/.env",
        );
    }

    return nodemailer.createTransport({
        host: EMAIL_HOST,
        port: Number(EMAIL_PORT),
        secure: Number(EMAIL_PORT) === 465,
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASSWORD,
        },
    });
}

function buildAlertContent({
    truckName,
    alertType,
    locationLabel,
    priority,
    taskId,
}) {
    const typeLabel =
        alertType === "citizen-report" ? "Citizen Complaint" : "Bin Full Alert";

    const subject = `[Swachh City] ${typeLabel} assigned to ${truckName}`;

    const text = [
        `Hello ${truckName},`,
        "",
        `A new ${typeLabel.toLowerCase()} has been assigned to you.`,
        `Priority: ${priority.toUpperCase()}`,
        `Location: ${locationLabel}`,
        `Task ID: ${taskId}`,
        "",
        "Please proceed to the location as soon as possible.",
        "- Swachh City Dispatch",
    ].join("\n");

    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
      <h2 style="margin: 0 0 12px;">Swachh City Driver Alert</h2>
      <p style="margin: 0 0 12px;">Hello <strong>${truckName}</strong>,</p>
      <p style="margin: 0 0 12px;">
        A new <strong>${typeLabel}</strong> has been assigned to you.
      </p>
      <ul style="margin: 0 0 12px; padding-left: 18px;">
        <li><strong>Priority:</strong> ${priority.toUpperCase()}</li>
        <li><strong>Location:</strong> ${locationLabel}</li>
        <li><strong>Task ID:</strong> ${taskId}</li>
      </ul>
      <p style="margin: 0;">Please proceed to the location as soon as possible.</p>
    </div>
  `;

    return { subject, text, html };
}

export async function sendDriverAlertEmail(req, res) {
    try {
        const { truckId, alertType, locationLabel, priority, taskId } = req.body;

        if (!truckId || !alertType || !locationLabel || !priority || !taskId) {
            return res.status(400).json({
                message:
                    "truckId, alertType, locationLabel, priority, and taskId are required",
            });
        }

        const truck = await Truck.findById(truckId).populate("driver", "name email");

        if (!truck) {
            return res.status(404).json({ message: "Truck not found" });
        }

        const testReceiver = process.env.TEST_DRIVER_EMAIL?.trim();
        const receiverEmail = testReceiver || truck.driver?.email;
        if (!receiverEmail) {
            return res.status(400).json({
                message:
                    "Driver email not available for this truck. Assign a driver account with email first.",
            });
        }

        const truckName = truck.driver?.name || truck.driverName || truck.regNo || "Driver";
        const transporter = createTransporter();
        const { subject, text, html } = buildAlertContent({
            truckName,
            alertType,
            locationLabel,
            priority,
            taskId,
        });

        const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;

        const info = await transporter.sendMail({
            from: `"Swachh City Dispatch" <${fromAddress}>`,
            to: receiverEmail,
            subject,
            text,
            html,
        });

        return res.status(200).json({
            message: "Driver alert email sent",
            to: receiverEmail,
            messageId: info.messageId,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Failed to send driver alert email",
        });
    }
}
