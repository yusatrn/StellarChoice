; ModuleID = 'autocfg_4d54c99741ef99d7_4.4e18865b449c358d-cgu.0'
source_filename = "autocfg_4d54c99741ef99d7_4.4e18865b449c358d-cgu.0"
target datalayout = "e-m:e-p270:32:32-p271:32:32-p272:64:64-i64:64-i128:128-f80:128-n8:16:32:64-S128"
target triple = "x86_64-unknown-linux-gnu"

@alloc_e6758488a51c40069ade2309416f0500 = private unnamed_addr constant [6 x i8] c"<anon>", align 1
@alloc_4258b12ada5ef08aac481ecd3933272a = private unnamed_addr constant <{ ptr, [16 x i8] }> <{ ptr @alloc_e6758488a51c40069ade2309416f0500, [16 x i8] c"\06\00\00\00\00\00\00\00\01\00\00\00\1F\00\00\00" }>, align 8

; autocfg_4d54c99741ef99d7_4::probe
; Function Attrs: nonlazybind uwtable
define void @_ZN26autocfg_4d54c99741ef99d7_45probe17habe8950684eb835dE() unnamed_addr #0 {
start:
  ret void
}

; core::panicking::panic_const::panic_const_div_by_zero
; Function Attrs: cold noinline noreturn nonlazybind uwtable
declare void @_ZN4core9panicking11panic_const23panic_const_div_by_zero17h518e0c82a24c5a80E(ptr align 8) unnamed_addr #1

attributes #0 = { nonlazybind uwtable "probe-stack"="inline-asm" "target-cpu"="x86-64" }
attributes #1 = { cold noinline noreturn nonlazybind uwtable "probe-stack"="inline-asm" "target-cpu"="x86-64" }

!llvm.module.flags = !{!0, !1}
!llvm.ident = !{!2}

!0 = !{i32 8, !"PIC Level", i32 2}
!1 = !{i32 2, !"RtLibUseGOT", i32 1}
!2 = !{!"rustc version 1.87.0 (17067e9ac 2025-05-09)"}
