; ModuleID = 'autocfg_783e771e0e5cb99d_4.d1f555827d71afac-cgu.0'
source_filename = "autocfg_783e771e0e5cb99d_4.d1f555827d71afac-cgu.0"
target datalayout = "e-m:w-p270:32:32-p271:32:32-p272:64:64-i64:64-i128:128-f80:128-n8:16:32:64-S128"
target triple = "x86_64-pc-windows-msvc"

@alloc_e6758488a51c40069ade2309416f0500 = private unnamed_addr constant [6 x i8] c"<anon>", align 1
@alloc_4258b12ada5ef08aac481ecd3933272a = private unnamed_addr constant <{ ptr, [16 x i8] }> <{ ptr @alloc_e6758488a51c40069ade2309416f0500, [16 x i8] c"\06\00\00\00\00\00\00\00\01\00\00\00\1F\00\00\00" }>, align 8

; autocfg_783e771e0e5cb99d_4::probe
; Function Attrs: uwtable
define void @_ZN26autocfg_783e771e0e5cb99d_45probe17h1df0fd2da15dfe1aE() unnamed_addr #0 {
start:
  ret void
}

; core::panicking::panic_const::panic_const_div_by_zero
; Function Attrs: cold noinline noreturn uwtable
declare void @_ZN4core9panicking11panic_const23panic_const_div_by_zero17h7bc4f99963786481E(ptr align 8) unnamed_addr #1

attributes #0 = { uwtable "target-cpu"="x86-64" "target-features"="+cx16,+sse3,+sahf" }
attributes #1 = { cold noinline noreturn uwtable "target-cpu"="x86-64" "target-features"="+cx16,+sse3,+sahf" }

!llvm.module.flags = !{!0}
!llvm.ident = !{!1}

!0 = !{i32 8, !"PIC Level", i32 2}
!1 = !{!"rustc version 1.87.0 (17067e9ac 2025-05-09)"}
