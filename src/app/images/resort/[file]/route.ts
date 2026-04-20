import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { resortImages } from "@/content/images";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ file: string }>;
};

function contentType(file: string) {
  const extension = path.extname(file).toLowerCase();

  if (extension === ".png") {
    return "image/png";
  }

  if (extension === ".webp") {
    return "image/webp";
  }

  return "image/jpeg";
}

function findFallback(file: string) {
  return Object.values(resortImages).find((image) => image.localSrc?.endsWith(`/${file}`));
}

export async function GET(_request: Request, { params }: RouteProps) {
  const { file } = await params;
  const safeFile = path.basename(file);

  if (safeFile !== file) {
    return new NextResponse("Invalid image path", { status: 400 });
  }

  const filePath = path.join(process.cwd(), "public", "images", "resort", safeFile);

  try {
    const body = await readFile(filePath);

    return new NextResponse(body, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": contentType(safeFile),
      },
    });
  } catch {
    const fallback = findFallback(safeFile);

    if (!fallback) {
      return new NextResponse("Image not found", { status: 404 });
    }

    return NextResponse.redirect(fallback.src, 307);
  }
}
