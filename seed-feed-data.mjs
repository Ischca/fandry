import { drizzle } from "drizzle-orm/mysql2";
import { eq, sql } from "drizzle-orm";
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema.js";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: "default" });

console.log("🌱 Starting feed data seeding...");

// 既存のテストデータを削除
console.log("🧹 Cleaning up existing test data...");
await db.delete(schema.likes).where(eq(schema.likes.userId, 1));
await db.delete(schema.follows).where(eq(schema.follows.userId, 1));
await db.delete(schema.posts);
await db.delete(schema.creators).where(sql`${schema.creators.userId} != 1`);
await db.delete(schema.users).where(sql`${schema.users.openId} LIKE 'test_%'`);
console.log("✅ Cleanup completed");

// 現在のユーザー（オーナー）のIDを取得
const [currentUser] = await db
  .select()
  .from(schema.users)
  .where(eq(schema.users.openId, process.env.OWNER_OPEN_ID))
  .limit(1);

if (!currentUser) {
  console.error("❌ Current user not found");
  process.exit(1);
}

console.log(`✅ Current user found: ${currentUser.name} (ID: ${currentUser.id})`);

// クリエイターデータ
const creatorsData = [
  {
    username: "artist_yuki",
    displayName: "雪野ユキ",
    bio: "イラストレーター。ファンタジー系のキャラクターデザインが得意です🎨",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=yuki",
    category: "illustration",
    socialLinks: JSON.stringify({ twitter: "https://twitter.com/artist_yuki", instagram: "https://instagram.com/artist_yuki" }),
  },
  {
    username: "writer_hana",
    displayName: "花咲ハナ",
    bio: "小説家。恋愛小説とSF短編を書いています📚",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=hana",
    category: "writing",
    socialLinks: JSON.stringify({ twitter: "https://twitter.com/writer_hana", website: "https://hana-novels.com" }),
  },
  {
    username: "musician_ren",
    displayName: "蓮音レン",
    bio: "作曲家・ピアニスト。オリジナル曲を制作しています🎹",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ren",
    category: "music",
    socialLinks: JSON.stringify({ youtube: "https://youtube.com/@musician_ren", twitter: "https://twitter.com/musician_ren" }),
  },
  {
    username: "photographer_sora",
    displayName: "空撮ソラ",
    bio: "風景写真家。日本各地の美しい景色を撮影しています📷",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sora",
    category: "photography",
    socialLinks: JSON.stringify({ instagram: "https://instagram.com/photographer_sora", website: "https://sora-photos.com" }),
  },
  {
    username: "designer_kai",
    displayName: "海野カイ",
    bio: "グラフィックデザイナー。ロゴやポスターのデザインをしています✨",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=kai",
    category: "design",
    socialLinks: JSON.stringify({ twitter: "https://twitter.com/designer_kai", website: "https://kai-design.com" }),
  },
  {
    username: "animator_miku",
    displayName: "未来ミク",
    bio: "アニメーター。2Dアニメーション制作をしています🎬",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=miku",
    category: "animation",
    socialLinks: JSON.stringify({ youtube: "https://youtube.com/@animator_miku", twitter: "https://twitter.com/animator_miku" }),
  },
  {
    username: "voice_actor_ryo",
    displayName: "涼宮リョウ",
    bio: "声優・ナレーター。キャラクターボイスの収録をしています🎤",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ryo",
    category: "voice",
    socialLinks: JSON.stringify({ youtube: "https://youtube.com/@voice_actor_ryo", twitter: "https://twitter.com/voice_actor_ryo" }),
  },
];

// クリエイターを作成
const createdCreators = [];
for (const creatorData of creatorsData) {
  // ユーザーを作成
  const [user] = await db
    .insert(schema.users)
    .values({
      openId: `test_${creatorData.username}`,
      name: creatorData.displayName,
      email: `${creatorData.username}@example.com`,
      avatarUrl: creatorData.avatarUrl,
      role: "user",
    })
    .$returningId();

  // クリエイタープロフィールを作成
  const [creator] = await db
    .insert(schema.creators)
    .values({
      userId: user.id,
      username: creatorData.username,
      displayName: creatorData.displayName,
      bio: creatorData.bio,
      avatarUrl: creatorData.avatarUrl,
      category: creatorData.category,
      socialLinks: creatorData.socialLinks,
      followerCount: Math.floor(Math.random() * 1000) + 50,
      totalSupport: Math.floor(Math.random() * 100000) + 1000,
    })
    .$returningId();

  createdCreators.push({ ...creator, ...creatorData, userId: user.id });
  console.log(`✅ Created creator: ${creatorData.displayName}`);
}

// 現在のユーザーが全クリエイターをフォロー
for (const creator of createdCreators) {
  await db.insert(schema.follows).values({
    userId: currentUser.id,
    creatorId: creator.id,
  });
}
console.log(`✅ Current user now follows all ${createdCreators.length} creators`);

// 投稿データ
const postsData = [
  // 雪野ユキの投稿
  {
    creatorIndex: 0,
    title: "新キャラクターデザイン完成！",
    content: "ファンタジー世界の魔法使いキャラクターを描きました✨ 今回は青と白を基調とした衣装デザインにしてみました。皆さんの感想をお聞かせください！",
    isPaid: false,
    price: 0,
  },
  {
    creatorIndex: 0,
    title: "【有料】高解像度イラストパック",
    content: "先月制作したイラスト10点の高解像度版をまとめました。壁紙やアイコンとしてご利用いただけます🎨",
    isPaid: true,
    price: 500,
  },
  {
    creatorIndex: 0,
    title: "制作過程の動画をアップロードしました",
    content: "キャラクターデザインの制作過程を早送りでまとめた動画です。ラフから完成までの流れをご覧ください！",
    isPaid: false,
    price: 0,
  },
  {
    creatorIndex: 0,
    title: "【会員限定】メイキング動画フルバージョン",
    content: "キャラクターデザインの制作過程をフルバージョンで公開します。ラフから完成までの全工程を詳しく解説しています。会員限定コンテンツです。",
    isMembership: true,
    price: 0,
  },
  // 花咲ハナの投稿
  {
    creatorIndex: 1,
    title: "新作短編小説「星降る夜に」公開",
    content: "SF短編小説の新作を公開しました。宇宙ステーションを舞台にした切ない恋愛物語です。読了時間は約15分です📚",
    isPaid: false,
    price: 0,
  },
  {
    creatorIndex: 1,
    title: "【有料】長編小説 第3章",
    content: "連載中の長編小説「時をかける図書館」の第3章です。いよいよ物語が動き出します！",
    isPaid: true,
    price: 300,
  },
  {
    creatorIndex: 1,
    title: "執筆の裏話",
    content: "最近の執筆活動について。プロットの作り方や、キャラクターの掘り下げ方など、創作の裏側をお話しします✍️",
    isPaid: false,
    price: 0,
  },
  // 蓮音レンの投稿
  {
    creatorIndex: 2,
    title: "新曲「春の訪れ」完成しました",
    content: "ピアノソロの新曲です。春の暖かさと希望を表現してみました。試聴版を公開していますので、ぜひお聴きください🎹",
    isPaid: false,
    price: 0,
  },
  {
    creatorIndex: 2,
    title: "【有料】フルバージョン＋楽譜",
    content: "「春の訪れ」のフルバージョンと楽譜のセットです。演奏してみたい方はぜひ！",
    isPaid: true,
    price: 800,
  },
  {
    creatorIndex: 2,
    title: "作曲の進捗報告",
    content: "現在制作中の夏をテーマにした曲の進捗です。メロディーラインは完成したので、これからアレンジを詰めていきます🎵",
    isPaid: false,
    price: 0,
  },
  // 空撮ソラの投稿
  {
    creatorIndex: 3,
    title: "富士山の朝焼け",
    content: "早朝5時に撮影した富士山です。雲海と朝焼けのコントラストが美しかったです📷",
    isPaid: false,
    price: 0,
  },
  {
    creatorIndex: 3,
    title: "【有料】京都の四季写真集",
    content: "1年かけて撮影した京都の四季をまとめた写真集です。全50枚の高解像度写真を収録しています。",
    isPaid: true,
    price: 1200,
  },
  {
    creatorIndex: 3,
    title: "撮影機材の紹介",
    content: "最近購入した新しいレンズの紹介です。風景撮影に最適な広角レンズで、表現の幅が広がりました✨",
    isPaid: false,
    price: 0,
  },
  // 海野カイの投稿
  {
    creatorIndex: 4,
    title: "ロゴデザインのポートフォリオ更新",
    content: "最近手がけたロゴデザインをいくつか公開します。シンプルで印象的なデザインを心がけています💼",
    isPaid: false,
    price: 0,
  },
  {
    creatorIndex: 4,
    title: "【有料】デザインテンプレート集",
    content: "SNS投稿用のデザインテンプレート30種類のセットです。Canvaで編集可能です。",
    isPaid: true,
    price: 600,
  },
  {
    creatorIndex: 4,
    title: "配色の考え方",
    content: "デザインにおける配色の基本について解説します。色相環の使い方や、調和する色の組み合わせなど🎨",
    isPaid: false,
    price: 0,
  },
  // 未来ミクの投稿
  {
    creatorIndex: 5,
    title: "新作アニメーション公開",
    content: "30秒の短編アニメーションを制作しました。手描きの温かみを大切にした作品です🎬",
    isPaid: false,
    price: 0,
  },
  {
    creatorIndex: 5,
    title: "【有料】アニメーション制作講座",
    content: "初心者向けのアニメーション制作講座です。基本的な動きの原理から、実践的なテクニックまで解説しています。",
    isPaid: true,
    price: 1500,
  },
  {
    creatorIndex: 5,
    title: "制作の舞台裏",
    content: "アニメーション制作の裏側をお見せします。ラフから完成までのプロセスを写真でまとめました📸",
    isPaid: false,
    price: 0,
  },
  // 涼宮リョウの投稿
  {
    creatorIndex: 6,
    title: "新しいキャラクターボイス収録",
    content: "ファンタジーゲームのキャラクターボイスを収録しました。サンプルボイスを公開していますのでお聴きください🎤",
    isPaid: false,
    price: 0,
  },
  {
    creatorIndex: 6,
    title: "【有料】ボイスドラマ「月夜の物語」",
    content: "オリジナルのボイスドラマです。1人で複数のキャラクターを演じ分けています。再生時間は約20分です。",
    isPaid: true,
    price: 400,
  },
  {
    creatorIndex: 6,
    title: "声優の日常",
    content: "最近の収録の様子や、ボイストレーニングの方法などをシェアします。声のケアも大切です！",
    isPaid: false,
    price: 0,
  },
];

// 投稿を作成
for (const postData of postsData) {
  const creator = createdCreators[postData.creatorIndex];
  let postType = 'free';
  if (postData.isPaid) {
    postType = 'paid';
  } else if (postData.isMembership) {
    postType = 'membership';
  }
  
  // ランダムなサンプル画像を追加（Unsplashのランダム画像）
  const randomImageId = Math.floor(Math.random() * 1000);
  const mediaUrls = JSON.stringify([`https://picsum.photos/seed/${creator.id}-${randomImageId}/800/600`]);
  
  await db.insert(schema.posts).values({
    creatorId: creator.id,
    title: postData.title,
    content: postData.content,
    type: postType,
    price: postData.price,
    membershipTier: postData.isMembership ? 1 : 0,
    mediaUrls: mediaUrls,
    likeCount: Math.floor(Math.random() * 100) + 5,
    commentCount: Math.floor(Math.random() * 20),
  });
}

console.log(`✅ Created ${postsData.length} posts`);

// いくつかの投稿にいいねを追加
const allPosts = await db.select().from(schema.posts).limit(10);
for (const post of allPosts.slice(0, 5)) {
  await db.insert(schema.likes).values({
    userId: currentUser.id,
    postId: post.id,
  });
}
console.log("✅ Added likes to some posts");

console.log("🎉 Feed data seeding completed!");

await connection.end();
