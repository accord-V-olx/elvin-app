
function jsonResponse(data, status = 200) {

  return new Response(
    JSON.stringify(data),
    {
      status,

      headers: {
        "content-type":
          "application/json; charset=utf-8",

        "cache-control":
          "no-store"
      }
    }
  );
}


function getOutputText(response) {

  const parts = [];


  for (
    const item
    of response.output || []
  ) {

    if (
      item.type !== "message"
    ) {
      continue;
    }


    for (
      const content
      of item.content || []
    ) {

      if (
        content.type === "output_text" &&
        typeof content.text === "string"
      ) {

        parts.push(
          content.text
        );
      }
    }
  }


  return parts.join("");
}


export default async (request) => {

  if (request.method !== "GET") {

    return jsonResponse(
      {
        error:
          "Method not allowed"
      },
      405
    );
  }


  try {

    const apiKey =
      Netlify.env.get(
        "OPENAI_API_KEY"
      );


    if (!apiKey) {

      return jsonResponse(
        {
          error:
            "OPENAI_API_KEY не знайдено."
        },
        500
      );
    }


    const url =
      new URL(request.url);


    const jobId =
      url.searchParams.get(
        "id"
      );


    if (!jobId) {

      return jsonResponse(
        {
          error:
            "Не передано ID аналізу."
        },
        400
      );
    }


    const response =
      await fetch(
        `https://api.openai.com/v1/responses/${encodeURIComponent(jobId)}`,
        {
          method: "GET",

          headers: {
            "Authorization":
              `Bearer ${apiKey}`
          }
        }
      );


    const rawText =
      await response.text();


    let data;


    try {

      data =
        JSON.parse(rawText);

    }
    catch {

      return jsonResponse(
        {
          error:
            `OpenAI повернув не JSON:\n${rawText}`
        },
        502
      );
    }


    if (!response.ok) {

      return jsonResponse(
        {
          error:
            data?.error?.message ||
            rawText
        },
        502
      );
    }


    if (
      data.status === "queued" ||
      data.status === "in_progress"
    ) {

      return jsonResponse(
        {
          status:
            data.status
        },
        200
      );
    }


    if (
      data.status === "failed" ||
      data.status === "cancelled" ||
      data.status === "incomplete"
    ) {

      return jsonResponse(
        {
          status:
            data.status,

          error:
            data?.error?.message ||
            data?.incomplete_details?.reason ||
            "Аналіз не завершився."
        },
        200
      );
    }


    if (
      data.status !== "completed"
    ) {

      return jsonResponse(
        {
          status:
            data.status ||
            "unknown"
        },
        200
      );
    }


    const outputText =
      getOutputText(data);


    if (!outputText) {

      return jsonResponse(
        {
          status:
            "failed",

          error:
            "Elvin не отримав результат аналізу."
        },
        200
      );
    }


    let result;


    try {

      result =
        JSON.parse(outputText);

    }
    catch {

      return jsonResponse(
        {
          status:
            "failed",

          error:
            `Не вдалося прочитати результат Elvin:\n${outputText}`
        },
        200
      );
    }


    return jsonResponse(
      {
        status:
          "completed",

        result
      },
      200
    );

  }
  catch (error) {

    console.error(
      "ELVIN STATUS ERROR",
      error
    );


    return jsonResponse(
      {
        error:
          error?.message ||
          String(error)
      },
      500
    );
  }
};
