import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

async function handleApiRequest(
  req: NextRequest,
  params: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params.params;
  const apiPath = resolvedParams.path.join("-");
  const filePath = path.join(process.cwd(), "api", `${apiPath}.js`);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json(
      { error: `API endpoint '${apiPath}' not found` },
      { status: 404 }
    );
  }

  try {
    const apiModule = await import(`file://${filePath}`);
    const handler = apiModule.default || apiModule.handler;

    if (typeof handler !== "function") {
      return NextResponse.json(
        { error: "Invalid API module handler" },
        { status: 500 }
      );
    }

    // Read request body if present
    let bodyText = "";
    try {
      bodyText = await req.text();
    } catch (_e) {}

    let bodyData: any = bodyText;
    if (bodyText && bodyText.startsWith("{")) {
      try {
        bodyData = JSON.parse(bodyText);
      } catch (_e) {}
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
