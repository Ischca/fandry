import { drizzle } from "drizzle-orm/mysql2";
import { users, creators, posts, tips, follows } from "../drizzle/schema.ts";
import dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

async function seed() {
  console.log("🌱 Starting database seeding...");

  try {
    // Create test users
    console.log("Creating test users...");
    const [user1Result] = await db.insert(users).values({
      openId: "test-creator-1",
      name: "山田太郎",
      email: "yamada@example.com",
      loginMethod: "manus",
    });

    const [user2Result] = await db.insert(users).values({
      openId: "test-creator-2",
      name: "佐藤花子",
      email: "sato@example.com",
      loginMethod: "manus",
    });

    const [user3Result] = await db.insert(users).values({
      openId: "test-fan-1",
      name: "鈴木一郎",
      email: "suzuki@example.com",
      loginMethod: "manus",
    });

    const user1Id = user1Result.insertId;
    const user2Id = user2Result.insertId;
    const user3Id = user3Result.insertId;

    console.log(`✓ Created users: ${user1Id}, ${user2Id}, ${user3Id}`);

    // Create creators
    console.log("Creating test creators...");
    const [creator1Result] = await db.insert(creators).values({
      userId: user1Id,
      username: "yamada_taro",
      displayName: "山田太郎",
      bio: "イラストレーターです。ファンタジー系のイラストを中心に描いています。",
      category: "イラスト",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=yamada",
      coverUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800",
    });

    const [creator2Result] = await db.insert(creators).values({
      userId: user2Id,
      username: "sato_hanako",
      displayName: "佐藤花子",
      bio: "音楽クリエイターです。オリジナル曲やカバー曲を投稿しています。",
      category: "音楽",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sato",
      coverUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800",
    });

    const creator1Id = creator1Result.insertId;
    const creator2Id = creator2Result.insertId;

    console.log(`✓ Created creators: ${creator1Id}, ${creator2Id}`);

    // Create posts
    console.log("Creating test posts...");
    await db.insert(posts).values([
      {
        creatorId: creator1Id,
        title: "新作イラスト完成しました！",
        content: "ファンタジー世界の風景イラストです。今回は特に空の表現にこだわりました。",
        type: "free",
        mediaUrls: JSON.stringify(["https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600"]),
      },
      {
        creatorId: creator1Id,
        title: "メイキング動画（限定公開）",
        content: "前回の作品のメイキング動画です。レイヤー構成や色の選び方など解説しています。",
        type: "paid",
        price: 500,
        mediaUrls: JSON.stringify(["https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600"]),
      },
      {
        creatorId: creator2Id,
        title: "新曲「星空の下で」公開",
        content: "オリジナル曲の新作です。穏やかなメロディーに仕上げました。",
        type: "free",
        mediaUrls: JSON.stringify(["https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600"]),
      },
      {
        creatorId: creator2Id,
        title: "制作裏話とボーカルトラック",
        content: "今回の曲の制作過程や、ボーカルトラックのみのバージョンを公開します。",
        type: "membership",
        membershipTier: 1,
        mediaUrls: JSON.stringify(["https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600"]),
      },
    ]);

    console.log("✓ Created posts");

    // Create follows
    console.log("Creating test follows...");
    await db.insert(follows).values([
      {
        userId: user3Id,
        creatorId: creator1Id,
      },
      {
        userId: user3Id,
        creatorId: creator2Id,
      },
    ]);

    console.log("✓ Created follows");

    // Create tips
    console.log("Creating test tips...");
    await db.insert(tips).values([
      {
        userId: user3Id,
        creatorId: creator1Id,
        amount: 1000,
        message: "素敵なイラストをありがとうございます！",
      },
      {
        userId: user3Id,
        creatorId: creator2Id,
        amount: 500,
        message: "新曲最高です！",
      },
    ]);

    console.log("✓ Created tips");

    // Update creator stats
    console.log("Updating creator stats...");
    await db.update(creators).set({
      followerCount: 1,
      totalSupport: 1000,
    }).where({ id: creator1Id });

    await db.update(creators).set({
      followerCount: 1,
      totalSupport: 500,
    }).where({ id: creator2Id });

    console.log("✓ Updated creator stats");

    console.log("\n✅ Database seeding completed successfully!");
    console.log("\nTest accounts:");
    console.log("- Creator 1: yamada_taro (山田太郎)");
    console.log("- Creator 2: sato_hanako (佐藤花子)");
    console.log("- Fan: suzuki (鈴木一郎)");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }

  process.exit(0);
}

seed();
