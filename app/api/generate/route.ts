import { NextResponse } from "next/server";
  // ✅ 不强制 promptKey（你有些模块可能靠 moduleId+mode 解析），但建议前端都传
  // 如果你想强制 promptKey，就把下面注释打开：
  // if (!promptKey) {
  //   return NextResponse.json(
  //     { ok: false, error: { message: "Missing promptKey" }, meta: { requestId } },
  //     { status: 400, headers }
  //   );
  // }

  const result = await runEngine({
    moduleId,
    promptKey,
    engineType: (engineType ?? "deepseek").toString(),
    mode: (mode ?? "default").toString(),
    industryId,
    userInput,
  } as any);

  // ✅ 直接把 runEngine 的结果返回给前端（前端不用改）
  // 关键：这里不会再出现 Missing coreKey（因为我们完全不读取 coreKey）
  return NextResponse.json(
    { ...result, meta: { ...(result as any)?.meta, requestId } },
    { status: result?.ok ? 200 : 400, headers }
  );
}

