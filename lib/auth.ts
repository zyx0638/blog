import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 天

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "缺少环境变量 SESSION_SECRET（至少 32 字节，可用 openssl rand -base64 32 生成）"
    );
  }
  return new TextEncoder().encode(secret);
}

/** 签发会话令牌（HS256 JWT，7 天有效期） */
export async function createSessionToken(username: string): Promise<string> {
  return await new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecret());
}

/** 校验会话令牌，失败返回 null */
export async function verifySessionToken(
  token: string
): Promise<{ username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return typeof payload.username === "string"
      ? { username: payload.username }
      : null;
  } catch {
    return null;
  }
}

/** 从 Cookie 请求头解析并校验会话 */
export async function getSessionFromCookie(
  cookieHeader: string | null
): Promise<{ username: string } | null> {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]*)`)
  );
  if (!match) return null;
  return verifySessionToken(decodeURIComponent(match[1]));
}

/** API 路由专用：校验请求中的会话，未登录返回 null（由调用方返回 401） */
export async function requireAuth(
  req: Request
): Promise<{ username: string } | null> {
  return getSessionFromCookie(req.headers.get("cookie"));
}
