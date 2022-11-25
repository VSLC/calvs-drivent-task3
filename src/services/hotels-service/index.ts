import { notFoundError, unauthorizedError } from "@/errors";
import enrollmentRepository from "@/repositories/enrollment-repository";
import hotelsRepository from "@/repositories/hotel-repository";
import ticketRepository from "@/repositories/ticket-repository";
import { TicketStatus } from "@prisma/client";

async function getHotels(userId: number) {
  const findEnrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!findEnrollment) {
    throw unauthorizedError();
  }
  const findTicket = await ticketRepository.findTicketByEnrollmentId(findEnrollment.id);
  if (!findTicket || findTicket.TicketType.isRemote === true || findTicket.TicketType.includesHotel === false || findTicket.status !== TicketStatus.PAID) {
    throw notFoundError();
  }

  const hotels = await hotelsRepository.findHotels();
  return hotels;
}

async function getHotelRooms(hotelId: number, userId: number) {
  const findEnrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!findEnrollment) {
    throw unauthorizedError();
  }

  const hotelsRooms = await hotelsRepository.findRoomsByHotelId(hotelId);
  return hotelsRooms;
}

const hotelServices = {
  getHotelRooms,
  getHotels
};

export default hotelServices;

