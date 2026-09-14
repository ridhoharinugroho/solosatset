import { NextRequest, NextResponse } from "next/server";

import adminAuthHandler from "../../../server/api/admin-auth.js";
import authLoginHandler from "../../../server/api/auth-login.js";
import authLogoutHandler from "../../../server/api/auth-logout.js";
import authOtpHandler from "../../../server/api/auth-otp.js";
import initDbHandler from "../../../server/api/init-db.js";
import pushNotifyHandler from "../../../server/api/push-notify.js";
import pushSubscribeHandler from "../../../server/api/push-subscribe.js";
import sendEmailHandler from "../../../server/api/send-email.js";
import trackInterestHandler from "../../../server/api/track-interest.js";
import uploadImageHandler from "../../../server/api/upload-image.js";
import userProfileHandler from "../../../server/api/user-profile.js";

const apiHandlers: Record<string, (req: any, res: any) => Promise<any> | any> = {
  "admin-auth": adminAuthHandler,
  "auth-login": authLoginHandler,
  "auth-logout": authLogoutHandler,
  "auth-otp": authOtpHandler,
  "init-db": initDbHandler,
  "push-notify": pushNotifyHandler,
  "push-subscribe": pushSubscribeHandler,
  "send-email": sendEmailHandler,
  "track-interest": trackInterestHandler,
  "upload-image": uploadImageHandler,
  "user-profile": userProfileHandler,
};

async function handleApiRequest(
  req: NextRequest,
  params: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params.params;
  const apiPath = resolvedParams.path.join("-");
  const handler = apiHandlers[apiPath];

  if (!handler || typeof handler !== "function") {
    return NextResponse.json(
      { error: `API endpoint '${apiPath}' not found` },
      { status: 404 }
    );
  }

  try {

    let bodyText = "";
    try {
      bodyText = await req.text();
    } catch (_e) {}

    let bodyData: any = bodyText;
    if (bodyText) {
      const trimmed = bodyText.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          bodyData = JSON.parse(trimmed);
        } catch (_e) {
          bodyData = bodyText;
        }
      }
    }

    // Extract headers and query
    const headers: Record<string, string> = {};
    req.headers.forEach((val, key) => {
      headers[key] = val;
    });

    const url = new URL(req.url);
    const query: Record<string, string> = {};
    url.searchParams.forEach((val, key) => {
      query[key] = val;
    });

    let statusCode = 200;
    let responseBody: any = null;
    const responseHeaders = new Headers();

    const mockReq = {
      method: req.method,
      headers: headers,
      query: query,
      body: bodyData,
      url: req.url,
    };

    const mockRes = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      setHeader(name: string, value: string) {
        responseHeaders.set(name, value);
        return this;
      },
      getHeader(name: string) {
        return responseHeaders.get(name);
      },
      json(data: any) {
        responseBody = JSON.stringify(data);
        responseHeaders.set("content-type", "application/json");
        return this;
      },
      send(data: any) {
        if (typeof data === "object") {
          responseBody = JSON.stringify(data);
          if (!responseHeaders.has("content-type")) {
            responseHeaders.set("content-type", "application/json");
          }
        } else {
          responseBody = String(data);
        }
        return this;
      },
      end(data?: any) {
        if (data) this.send(data);
        return this;
      },
    };

    await handler(mockReq, mockRes);

    return new NextResponse(responseBody ?? "", {
      status: statusCode,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error(`[Next API Route Handler Error - ${apiPath}]:`, err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return handleApiRequest(req, context);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return handleApiRequest(req, context);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return handleApiRequest(req, context);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return handleApiRequest(req, context);
}
