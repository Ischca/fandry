// Environment: server
// このフックはSSR時にサーバーで実行され、Clerk認証情報をpageContextに追加する

import type { PageContextServer } from "vike/types";
import type { Request, Response } from "express";
import { getAuth } from "@clerk/express";

// pageContextの拡張型定義
declare global {
  namespace Vike {
    interface PageContextServer {
      expressRequest?: Request;
      expressResponse?: Response;
    }
    interface PageContext {
      user: {
        id: string;
        sessionId: string | null;
      } | null;
    }
  }
}

export async function onCreatePageContext(pageContext: PageContextServer) {
  const req = pageContext.expressRequest;

  if (!req) {
    pageContext.user = null;
    return;
  }

  try {
    // Clerk middlewareがreqにauth情報を付与している
    const auth = getAuth(req);

    if (auth.userId) {
      pageContext.user = {
        id: auth.userId,
        sessionId: auth.sessionId,
      };
    } else {
      pageContext.user = null;
    }
  } catch (error) {
    console.error("SSR Auth Error:", error);
    pageContext.user = null;
  }
}
