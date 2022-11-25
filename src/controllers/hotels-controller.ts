import { AuthenticatedRequest } from "@/middlewares";
import hotelServices from "@/services/hotels-service";
import { Response } from "express";
import httpStatus from "http-status";

export async function getHotels(req: AuthenticatedRequest, res: Response) {
  try {
    const { userId } = req;

    const hotels = hotelServices.getHotels(userId);
    return res.status(httpStatus.OK).send(hotels);
  } catch (error) {
    if (error.name === "UnauthorizedError") {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
    if (error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
  }
}

export async function getRoomsByHotelId(req: AuthenticatedRequest, res: Response) {
  try {
    const { userId } = req;
    const hotelId = Number(req.params.hotelId);

    const hotelRooms = await hotelServices.getHotelRooms(hotelId, userId);
    return res.status(httpStatus.OK).send(hotelRooms);
  } catch (error) {
    if (error.name === "UnauthorizedError") {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
    return res.sendStatus(httpStatus.NOT_FOUND);
  }
}

