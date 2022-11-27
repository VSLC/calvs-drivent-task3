import app, { init } from "@/app";
import httpStatus from "http-status";
import supertest from "supertest";
import { faker } from "@faker-js/faker";
import * as jwt from "jsonwebtoken";
import { cleanDb, generateValidToken } from "../helpers";
import { createRoom, createPayment, createHotel, createUser, createEnrollmentWithAddress, createTicketTypeIncludeHotel, createTicket, createTicketType } from "../factories";
import { TicketStatus } from "@prisma/client";

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe("GET: /hotels", () => {
  describe("If token is not valid", () => {
    it("Should respond with status 401 if the token doesn't exist", async () => {
      const result = await server.get("/hotels");
      expect(result.status).toBe(httpStatus.UNAUTHORIZED);
    });
    it("Should respond with status 401 if the token is not valid", async () => {
      const token = faker.lorem.word();
      const result = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
      expect(result.status).toBe(httpStatus.UNAUTHORIZED);
    });
    it("should respond with status 401 if there is no session for given token", async () => {
      const userWithoutSession = await createUser();
      const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
      const result = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
      expect(result.status).toBe(httpStatus.UNAUTHORIZED);
    });
  });
  describe("If token is valid", () => {
    it("should respond with status 404 when user doesnt own a ticket", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);
      const result = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
      expect(result.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 402 when ticket has no payment", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
      const result = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
      expect(result.status).toEqual(httpStatus.PAYMENT_REQUIRED);
    });

    it("should respond with status 403 when ticket doesnt include a hotel", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const includesHotel = false;
      const ticketType = await createTicketTypeIncludeHotel(includesHotel);
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const result = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
      expect(result.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with empty array when there are no hotels", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const includesHotel = true;
      const ticketType = await createTicketTypeIncludeHotel(includesHotel);
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const result = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
      expect(result.body).toEqual([]);
    });

    it("should respond with status 200 and with existing hotels data", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const includesHotel = true;
      const ticketType = await createTicketTypeIncludeHotel(includesHotel);
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const hotel = await createHotel();
      const result = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
      expect(result.status).toBe(httpStatus.OK);
      expect(result.body).toEqual([
        {
          id: hotel.id,
          name: hotel.name,
          image: hotel.image,
          createdAt: hotel.createdAt.toISOString(),
          updatedAt: hotel.updatedAt.toISOString(),
        },
      ]);
    });
  });
});

describe("GET: /hotels/:hotelId", () => {
  describe("If token is not valid", () => {
    it("Should respond with status 401 if the token doesn't exist", async () => {
      const result = await server.get("/hotels/2");
      expect(result.status).toBe(httpStatus.UNAUTHORIZED);
    });
    it("Should respond with status 401 if the token is not valid", async () => {
      const token = faker.lorem.word();
      const result = await server.get("/hotels/1").set("Authorization", `Bearer ${token}`);
      expect(result.status).toBe(httpStatus.UNAUTHORIZED);
    });
    it("should respond with status 401 if there is no session for given token", async () => {
      const userWithoutSession = await createUser();
      const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
      const result = await server.get("/hotels/1").set("Authorization", `Bearer ${token}`);
      expect(result.status).toBe(httpStatus.UNAUTHORIZED);
    });
  });
  describe("When token is valid", () => {
    it("should respond with status 402 when ticket has no payment", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

      const result = await server.get("/hotels/1").set("Authorization", `Bearer ${token}`);

      expect(result.status).toEqual(httpStatus.PAYMENT_REQUIRED);
    });

    it("should respond with status 403 when ticket doesnt include a hotel", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const includesHotel = false;
      const ticketType = await createTicketTypeIncludeHotel(includesHotel);
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);

      const result = await server.get("/hotels/1").set("Authorization", `Bearer ${token}`);

      expect(result.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 404 when the hotel id doesnt exist", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const includesHotel = true;
      const ticketType = await createTicketTypeIncludeHotel(includesHotel);
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const result = await server.get("/hotels/1").set("Authorization", `Bearer ${token}`);
      expect(result.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 200 and an empty array for Rooms when the hotel has no rooms", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const includesHotel = true;
      const ticketType = await createTicketTypeIncludeHotel(includesHotel);
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const hotelWithoutRooms = await createHotel();
      const result = await server.get(`/hotels/${hotelWithoutRooms.id}`).set("Authorization", `Bearer ${token}`);
      expect(result.status).toEqual(httpStatus.OK);
      expect(result.body).toEqual({
        id: hotelWithoutRooms.id,
        name: hotelWithoutRooms.name,
        image: hotelWithoutRooms.image,
        createdAt: hotelWithoutRooms.createdAt.toISOString(),
        updatedAt: hotelWithoutRooms.updatedAt.toISOString(),
        Rooms: [],
      });
    });

    it("should respond with status 200 and hotel data with rooms", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const includesHotel = true;
      const ticketType = await createTicketTypeIncludeHotel(includesHotel);
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const hotelWithRooms = await createHotel();
      const room = await createRoom(hotelWithRooms.id);
      const result = await server.get(`/hotels/${hotelWithRooms.id}`).set("Authorization", `Bearer ${token}`);
      expect(result.status).toEqual(httpStatus.OK);
      expect(result.body).toEqual({
        id: hotelWithRooms.id,
        name: hotelWithRooms.name,
        image: hotelWithRooms.image,
        createdAt: hotelWithRooms.createdAt.toISOString(),
        updatedAt: hotelWithRooms.updatedAt.toISOString(),
        Rooms: [{
          id: room.id,
          name: room.name,
          capacity: room.capacity,
          hotelId: room.hotelId,
          createdAt: room.createdAt.toISOString(),
          updatedAt: room.updatedAt.toISOString(),
        }],
      });
    });
  });
});  
