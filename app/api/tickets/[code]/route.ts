import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { code },
      include: {
        attendee: true,
        checkIn: true,
        order: {
          include: {
            event: { select: { title: true, id: true } },
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Entrada no encontrada" },
        { status: 404 }
      );
    }

    if (ticket.status === "CANCELLED" || ticket.status === "REFUNDED") {
      return NextResponse.json({
        success: false,
        message: `Entrada ${ticket.status === "CANCELLED" ? "cancelada" : "reembolsada"}`,
      });
    }

    if (ticket.status === "USED" || ticket.checkIn) {
      return NextResponse.json({
        success: false,
        message: "Entrada ya utilizada",
      });
    }

    // Mark as checked in
    await prisma.checkIn.create({
      data: {
        ticketId: ticket.id,
        scannedAt: new Date(),
      },
    });

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: "USED" },
    });

    return NextResponse.json({
      success: true,
      message: "Bienvenido al evento",
      attendee: ticket.attendee
        ? {
            firstName: ticket.attendee.firstName,
            lastName: ticket.attendee.lastName,
          }
        : null,
    });
  } catch (error) {
    console.error(`GET /api/tickets/${code} error:`, error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
