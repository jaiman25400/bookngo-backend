export class DashboardBookingResponseDto {
  id: string;
  confirmationId: string; // Formatted as BK-XXXXXX
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  activityName: string;
  activityId: number;
  zoneName: string;
  zoneId: number;
  timeSlot: string; // Format: "09:00 - 11:00"
  startTime: string;
  endTime: string;
  participants: number; // numberOfTickets
  status: 'STAGED' | 'CONFIRMED' | 'CHECKED_IN' | 'CANCELLED' | 'COMPLETED';
  paymentStatus: boolean;
  waiverSigned: boolean;
  waiverSignedAt: Date | null;
  checkedInAt: Date | null;
  price: number; // Total price including activity + rentals
  activityPrice: number;
  rentalPrice: number;
  bookingDate: string;
  createdAt: Date;
}
