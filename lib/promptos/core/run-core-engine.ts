  const coreKey = String(opts.coreKey ?? "").trim();
  const tier = normalizeTier(opts.tier);

  if (!coreKey) {
    return { ok: false, requestId, error: "Missing coreKey" };
  }

  const engineType = normalizeEngineType(opts.engineType);
  const mode = normalizeTier(opts.mode ?? tier);

  const pk = String(opts.promptKey ?? "").trim();
  if (!pk) {
    return {
      ok: false,
      requestId,
      coreKey,
      tier,
      promptKey: "",
      error: "Missing promptKey",
    };
  }

  if (!hasPromptKey(pk)) {
    return {
      ok: false,
      requestId,
      coreKey,
      tier,
      promptKey: pk,
      error: `promptKey not found in PROMPT_BANK: ${pk} (keys=${Object.keys(PROMPT_BANK as any).length})`,
    };
  }

  const userInputStr =
    typeof opts.userInput === "string"
      ? opts.userInput
      : JSON.stringify(opts.userInput ?? {}, null, 2);

  const moduleId = String(opts.moduleId ?? coreKey);
  const industryId = opts.industryId ?? null;

  try {
    const result = await runEngine({
      moduleId,
      promptKey: pk,
      userInput: userInputStr,
      engineType,
      mode,
      industryId,
    });

    if (!result || (result as any).error) {
      return {
        ok: false,
        requestId,
        coreKey,
        tier,
        promptKey: pk,
        error: (result as any)?.error ?? "Unknown engine error",
        raw: result,
      };
    }

    return {
      ok: true,
      requestId,
      coreKey,
      tier,
      moduleId,
      promptKey: pk,
      engineTypeRequested: engineType,
      engineTypeUsed: (result as any)?.engineType ?? engineType,
      mode,
      industryId,
      finalPrompt: (result as any)?.finalPrompt,
      modelOutput: (result as any)?.modelOutput ?? (result as any)?.output,
      raw: result,
    };
  } catch (e: any) {
    return {
      ok: false,
      requestId,
      coreKey,
      tier,
      promptKey: pk,
      error: e?.message ?? String(e),
    };
  }
}
