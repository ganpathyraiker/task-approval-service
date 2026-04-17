import { userRepository } from "../repositories/user.repository";

export const userService = {
  findAll() {
    return userRepository.findAll();
  },
};
