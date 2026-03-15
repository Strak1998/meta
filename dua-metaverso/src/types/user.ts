export type AvatarStyle = "URBAN" | "AFRO" | "COSMIC";

export type AvatarFace = "A" | "B" | "C";
export type AvatarBody = "1" | "2" | "3";

export type CountryCode = string;

export interface AvatarSelection {
  face: AvatarFace;
  body: AvatarBody;
}

export interface UserProfile {
  id: string;
  name: string;
  avatarStyle: AvatarStyle;
  avatarFace: AvatarFace;
  avatarBody: AvatarBody;
  country: CountryCode;
  joinedAt: number;
}

export interface PresencePayload {
  action: "upsert" | "remove";
  user?: UserProfile;
  userId?: string;
}
