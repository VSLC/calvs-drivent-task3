import { notFoundError, requestError, forbiddenError, paymentError } from "@/errors";
import enrollmentRepository from "@/repositories/enrollment-repository";
import hotelsRepository from "@/repositories/hotel-repository";
import ticketRepository from "@/repositories/ticket-repository";
import paymentRepository from "@/repositories/payment-repository";
import httpStatus from "http-status";
import { TicketStatus } from "@prisma/client";

async function getHotelsServices(userId: number) {
  await confirmTicketAndPayment(userId);
  const allHotels = await hotelsRepository.findHotels();
  return allHotels;
}

async function getHotelRoomsServices(hotelId: number, userId: number) {
  await confirmTicketAndPayment(userId);
  if (isNaN(hotelId)) {
    throw requestError(httpStatus.BAD_REQUEST, "BAD_REQUEST");
  }
  const hotelsRooms = await hotelsRepository.findRoomsByHotelId(hotelId);

  if (!hotelsRooms) {
    throw notFoundError();
  }
  return hotelsRooms;
}

async function confirmTicketAndPayment(userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) {
    throw notFoundError();
  }

  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket) {
    throw notFoundError();
  }

  const payment = await paymentRepository.findPaymentByTicketId(ticket.id);
  if (ticket.status !== TicketStatus.PAID || !payment) {
    throw paymentError();
  }

  if (!ticket.TicketType.includesHotel) {
    throw forbiddenError();
  }
}

const hotelServices = {
  getHotelRoomsServices,
  getHotelsServices
};

export default hotelServices;

