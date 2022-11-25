import { prisma } from "@/config";
import { Room } from "@prisma/client";

async function findHotels() {
  return prisma.hotel.findMany();
}

async function findRoomsByHotelId(hotelId: number) {
  return prisma.hotel.findMany({
    where: {
      id: hotelId,
    },
    include: {
      Rooms: true,
    }
  });
}

const hotelsRepository = {
  findRoomsByHotelId,
  findHotels
};

export default hotelsRepository;
