import { Configuration, OpenAIApi } from "openai";
import fetch from "node-fetch";
import { Request, Response } from "express";

const configuration = new Configuration({
  apiKey: "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",
});

const openai = new OpenAIApi(configuration);

export function getToday() {
  const date = new Date();

  const day = ("0" + date.getDate()).slice(-2);
  const month = ("0" + (date.getMonth() + 1)).slice(-2);
  const year = date.getFullYear();

  return day + "/" + month + "/" + year;
}

export function generateGPTPrompt(
  socialMediaPlatform: string,
  brandName: string,
  products: string[],
  city: string,
  foundationyear: number,
  companySlogan: string,
  competitors: string[],
  numberOfPost: number,
  postTone: string
) {
  const formattedProducts = products.join(", ");
  const formattedCompetitors = competitors.join(", ");
  const content = `As a ${socialMediaPlatform} content strategist for ${brandName}, a company specializing in ${formattedProducts} based in ${city} since its foundation on ${foundationyear}, today being ${getToday()}, with the slogan ${companySlogan} and having competitors such as ${formattedCompetitors}, you are tasked to create ${numberOfPost} ${socialMediaPlatform} post based on the following criterias: choose one of the following post theme (Brand awareness), do not mention competitor names in the post, do not mention which theme was chosen, do not use irrelevant events or temperature to the current month, don't use out of season concept, have a ${postTone} tone, use emojis, have 1-3 hashtags, embed hashtags into post text if relevant, do not make up fake promotions or days. After generating the post text, extract the main subject of the post text that would be depicted on post image and give me 3-6-word brief definition of that subject for each post without mentioning brand or company name and return object as json object {post: string, keywords: string[]}`;
  return content;
}

export function generateImagePrompt(keywords = []) {
  const formattedKeywords = keywords.join(", ");
  const prompt = `((Best quality)) Commercial photograph, ${formattedKeywords} (center of screen) , (good composition), (in frame), centered, 8k, 4k, detailed, attractive, beautiful, impressive, photorealistic, realistic, cinematic composition, volumetric lighting, high-resolution, vivid, detailed, stunning, professional, lifelike, crisp, flawless, DSLR, 4k, 8k, 16k, 1024, 2048, 4096, detailed, sharp, best quality, high quality, highres, absurdres`;
  const negativePrompt =
    "(bad composition), (out of frame), off center, drawing, anime, art, cartoon, painting, drawing, anime, art, cartoon, painting, drawing, anime, art, cartoon, painting, Low quality, worst quality, bad anatomy, bad gun anatomy, 144p, blurry, censored, artifacts, jpeg artifact, oversaturation, watermark, signature, EasyNegative, verybadimagenegative, bad hand, duplicates, distortion";

  return { prompt, negativePrompt };
}

export async function generatePostDetails(gptPrompt: any) {
  /* const content = generateGPTPrompt(
    "Facebook",
    "Gege Cake",
    ["Desserts", "bakery", "foods", "cakes", "cookies", "croissants", "pies"],
    "London",
    1990,
    "Eat little bit",
    ["Entree", "PeckaCudo"],
    1,
    "friendly"
  ); */
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: gptPrompt }],
    });
    let res = null
    if(completion?.data?.choices[0]?.message?.content)
    res = JSON.parse (completion.data.choices[0].message.content);
    return res;
  } catch (error) {
    console.log(error);
  }
}

export async function generateImage(
  model_id: string,
  width: number,
  height: number,
  samples: number,
  num_inference_steps: number,
  scheduler: string,
  content: string
) {
  const postDetails = await generatePostDetails(content);
  console.log('----',postDetails)
  const imgPrompt = generateImagePrompt(postDetails.keywords);

  const params = {
    key: "npjmaHM3XrYce9VmtHMPLJBLeioMWXLcyCJzruwhjUke2avn1buGXO5lmcCR",
    model_id,
    prompt: imgPrompt.prompt,
    negative_prompt: imgPrompt.negativePrompt,
    width,
    height,
    samples,
    num_inference_steps,
    scheduler,
  };

  const response = await fetch(
    "https://stablediffusionapi.com/api/v4/dreambooth",
    {
      method: "post",
      body: JSON.stringify(params),
      headers: { "Content-Type": "application/json" },
    }
  );
  const imageDetails = await response.json();
  return { imageDetails, postDetails }
}

export async function createImage(req: Request, res: Response) {
  const {
    socialMediaPlatform,
    brandName,
    products,
    city,
    foundationyear,
    companySlogan,
    competitors,
    numberOfPost,
    postTone,
  } = req.body;
  try {
    const gptPrompt = generateGPTPrompt(
      socialMediaPlatform,
      brandName,
      products,
      city,
      foundationyear,
      companySlogan,
      competitors,
      numberOfPost,
      postTone
    );
    const imageDetails = await generateImage(
      "realistic-vision-v13",
      768,
      768,
      1,
      41,
      "DPMSolverMultistepScheduler",
      gptPrompt
    );
    res.status(201).json(imageDetails);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
