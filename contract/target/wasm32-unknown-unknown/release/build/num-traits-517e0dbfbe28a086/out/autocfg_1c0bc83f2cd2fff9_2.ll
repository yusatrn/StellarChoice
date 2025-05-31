; ModuleID = 'autocfg_1c0bc83f2cd2fff9_2.609aad3f0018cc6c-cgu.0'
source_filename = "autocfg_1c0bc83f2cd2fff9_2.609aad3f0018cc6c-cgu.0"
target datalayout = "e-m:e-p:32:32-p10:8:8-p20:8:8-i64:64-i128:128-n32:64-S128-ni:1:10:20"
target triple = "wasm32-unknown-unknown"

; autocfg_1c0bc83f2cd2fff9_2::probe
; Function Attrs: nounwind
define dso_local void @_ZN26autocfg_1c0bc83f2cd2fff9_25probe17ha0f059946f4bb794E() unnamed_addr #0 {
start:
  %0 = alloca [4 x i8], align 4
  store i32 -2147483648, ptr %0, align 4
  %_0.i = load i32, ptr %0, align 4
  ret void
}

; Function Attrs: nocallback nofree nosync nounwind speculatable willreturn memory(none)
declare i32 @llvm.bitreverse.i32(i32) #1

attributes #0 = { nounwind "target-cpu"="generic" }
attributes #1 = { nocallback nofree nosync nounwind speculatable willreturn memory(none) }

!llvm.ident = !{!0}

!0 = !{!"rustc version 1.87.0 (17067e9ac 2025-05-09)"}
