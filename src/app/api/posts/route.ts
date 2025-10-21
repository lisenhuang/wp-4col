import { NextResponse } from "next/server";

const WORDPRESS_POSTS_ENDPOINT =
  "https://wordpress.org/news/wp-json/wp/v2/posts?_embed&per_page=12";

export async function GET() {
  try {
    const response = await fetch(WORDPRESS_POSTS_ENDPOINT, {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 300,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "Failed to retrieve WordPress posts." },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("WordPress fetch failed:", error);
    return NextResponse.json(
      { message: "Unexpected error retrieving WordPress posts." },
      { status: 500 },
    );
  }
}
