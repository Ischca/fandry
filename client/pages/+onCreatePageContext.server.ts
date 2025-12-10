// Environment: server
// このフックはSSR時にサーバーで実行され、Clerk認証情報をpageContextに追加する

import type { PageContextServer } from "vike/types";
import type { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import type { InitialState } from "@clerk/shared/types";

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
      clerkInitialState: InitialState | null;
    }
  }
}

export async function onCreatePageContext(pageContext: PageContextServer) {
  const req = pageContext.expressRequest;

  if (!req) {
    pageContext.user = null;
    pageContext.clerkInitialState = null;
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

      // ClerkProvider用のInitialStateを構築
      // getAuth()から取得できるserializable なデータのみを使用
      pageContext.clerkInitialState = {
        userId: auth.userId,
        sessionId: auth.sessionId ?? undefined,
        sessionClaims: auth.sessionClaims ?? undefined,
        sessionStatus: auth.sessionClaims ? "active" : undefined,
        orgId: auth.orgId ?? undefined,
        orgRole: auth.orgRole ?? undefined,
        orgSlug: auth.orgSlug ?? undefined,
        orgPermissions: auth.orgPermissions ?? undefined,
        factorVerificationAge: auth.factorVerificationAge ?? undefined,
        actor: auth.actor ?? undefined,
        // Resources（user, session, organization）はクライアントで取得
        user: undefined,
        session: undefined,
        organization: undefined,
      };
    } else {
      pageContext.user = null;
      // 未認証状態のInitialState
      pageContext.clerkInitialState = {
        userId: undefined,
        sessionId: undefined,
        sessionClaims: undefined,
        sessionStatus: undefined,
        orgId: undefined,
        orgRole: undefined,
        orgSlug: undefined,
        orgPermissions: undefined,
        factorVerificationAge: undefined,
        actor: undefined,
        user: undefined,
        session: undefined,
        organization: undefined,
      };
    }
  } catch (error) {
    console.error("SSR Auth Error:", error);
    pageContext.user = null;
    pageContext.clerkInitialState = null;
  }
}
