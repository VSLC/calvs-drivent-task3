import { notFoundError, requestError, forbiddenError, paymentError } from "@/errors";
import enrollmentRepository from "@/repositories/enrollment-repository";
import hotelsRepository from "@/repositories/hotel-repository";
import ticketRepository from "@/repositories/ticket-repository";
import paymentRepository from "@/repositories/payment-repository";
import { TicketStatus } from "@prisma/client";

async function getHotelsServices(userId: number) {
  await confirmTicketAndPayment(userId);
  const allHotels = await hotelsRepository.findHotels();
  return allHotels;
}

async function getHotelRoomsServices(hotelId: number, userId: number) {
  await confirmTicketAndPayment(userId);
  const hotelsRoomsbyHotelId = await hotelsRepository.findRoomsByHotelId(hotelId);
  if (!hotelsRoomsbyHotelId) {
    throw notFoundError();
  }
  return hotelsRoomsbyHotelId;
}

async function confirmTicketAndPayment(userId: number) {
  const findEnrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!findEnrollment) {
    throw notFoundError();
  }
  const findTicket = await ticketRepository.findTicketByEnrollmentId(findEnrollment.id);
  if (!findTicket) {
    throw notFoundError();
  }
  const findPayment = await paymentRepository.findPaymentByTicketId(findTicket.id);
  if (findTicket.status !== TicketStatus.PAID || !findPayment) {
    throw paymentError();
  }
  if (!findTicket.TicketType.includesHotel) {
    throw forbiddenError();
  }
}
const hotelServices = {
  getHotelRoomsServices,
  getHotelsServices
};

export default hotelServices;

