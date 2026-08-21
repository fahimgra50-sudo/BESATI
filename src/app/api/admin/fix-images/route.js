import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/auth";

async function saveImagePermanently(url) {
  if (!url || !url.trim()) return { ok: false, url, reason: "খালি লিংক" };
  if (url.includes("blob.vercel-storage.com")) return { ok: true, url, reason: "ইতিমধ্যে সেভ করা আছে" };
  try {
    const res = await fetch(url);
    if (!res.ok) return { ok: false, url, reason: `ডাউনলোড ব্যর্থ (status ${res.status})` };
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : contentType.includes("gif") ? "gif" : "jpg";
    const filename = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const blob = await put(filename, buffer, { access: "public", contentType });
    return { ok: true, url: blob.url };
  } catch (e) {
    return { ok: false, url, reason: String(e.message || e) };
  }
}

export async function GET(req) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    where: { imageUrl: { not: null } },
  });

  const results = [];
  for (const p of products) {
    if (p.imageUrl && p.imageUrl.includes("blob.vercel-storage.com")) {
      results.push({ id: p.id, name: p.name, status: "স্কিপ (ইতিমধ্যে সেভ করা)" });
      continue;
    }
    const result = await saveImagePermanently(p.imageUrl);
    if (result.ok && result.url !== p.imageUrl) {
      await prisma.product.update({ where: { id: p.id }, data: { imageUrl: result.url } });
      results.push({ id: p.id, name: p.name, status: "✅ সেভ হয়েছে", newUrl: result.url });
    } else if (!result.ok) {
      results.push({ id: p.id, name: p.name, status: `❌ ব্যর্থ — ${result.reason}` });
    } else {
      results.push({ id: p.id, name: p.name, status: "স্কিপ" });
    }
  }

  return NextResponse.json({ message: `${results.length} টা প্রোডাক্ট প্রসেস করা হয়েছে`, results });
}
