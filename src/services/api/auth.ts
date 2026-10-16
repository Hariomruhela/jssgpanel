export interface LoginPayload {
  email: string
  password: string
}

export interface SignupPayload {
  fullName: string
  email: string
  phone: string
  password: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
}

export interface AuthResponse {
  user: AuthUser
  token: string
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  await new Promise((resolve) => setTimeout(resolve, 800))
  return {
    user: {
      id: "u1",
      name: "Rohit Shah",
      email: payload.email,
      role: "Super Admin",
    },
    token: "mock-access-token",
  }
}

export async function signup(payload: SignupPayload): Promise<AuthResponse> {
  await new Promise((resolve) => setTimeout(resolve, 900))
  return {
    user: {
      id: "u-new",
      name: payload.fullName,
      email: payload.email,
      role: "Admin",
    },
    token: "mock-access-token",
  }
}