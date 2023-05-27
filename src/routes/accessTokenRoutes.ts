import express, { Request, Response } from "express";
import fetch from "node-fetch";

type AccessTokenResponse = {
  access_token: string
}

async function getLongLivedUserAccessToken(shortLivedAccessToken: string): Promise<AccessTokenResponse> {
  const res = await fetch(`https://graph.facebook.com/v16.0/oauth/access_token?grant_type=fb_exchange_token&client_id=1406901643443036&client_secret=e0bfce92fd3e8a628a2787daf29e7de0&fb_exchange_token=${shortLivedAccessToken}`);
  const json: any = await res.json();
  console.log("long-lived-token", json);
  return json;
}

async function getLongLivedPageAccessToken(shortLivedAccessToken: string, userId: string) {
  const longLivedUserAccessToken = await getLongLivedUserAccessToken(
    shortLivedAccessToken
  );

  console.log('---',longLivedUserAccessToken)

  const res = await fetch(
    `https://graph.facebook.com/v16.0/${userId}/accounts?access_token=${longLivedUserAccessToken.access_token}`
  );
  const json = await res.json();
  console.log("long-lived-page", json);
  return json;
}

async function handlePageAccessToken(req: Request, res: Response) {
  const { shortLivedAccessToken, userId } = req.body;
  console.log('short',shortLivedAccessToken)
  const result = await getLongLivedPageAccessToken(shortLivedAccessToken, userId);
  return res.json(result);
}

const router = express.Router();
router.post("/fb-long-lived-page-access-token", handlePageAccessToken);

export default router;
