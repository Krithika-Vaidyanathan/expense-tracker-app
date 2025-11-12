export type User = {
  id: string;
  email?: string;
  phone?: string;
  user_metadata: {
    name?: string;
  };
};

export type SignupPayload = {
  name: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};
