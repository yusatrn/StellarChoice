; ModuleID = 'autocfg_4d54c99741ef99d7_5.77604435260c1e3c-cgu.0'
source_filename = "autocfg_4d54c99741ef99d7_5.77604435260c1e3c-cgu.0"
target datalayout = "e-m:e-p270:32:32-p271:32:32-p272:64:64-i64:64-i128:128-f80:128-n8:16:32:64-S128"
target triple = "x86_64-unknown-linux-gnu"

; core::f64::<impl f64>::copysign
; Function Attrs: inlinehint nonlazybind uwtable
define internal double @"_ZN4core3f6421_$LT$impl$u20$f64$GT$8copysign17h5d4e58b1d60a7106E"(double %self, double %sign) unnamed_addr #0 {
start:
  %0 = alloca [8 x i8], align 8
  %1 = call double @llvm.copysign.f64(double %self, double %sign)
  store double %1, ptr %0, align 8
  %_0 = load double, ptr %0, align 8
  ret double %_0
}

; autocfg_4d54c99741ef99d7_5::probe
; Function Attrs: nonlazybind uwtable
define void @_ZN26autocfg_4d54c99741ef99d7_55probe17hf31a78303b13a349E() unnamed_addr #1 {
start:
; call core::f64::<impl f64>::copysign
  %_1 = call double @"_ZN4core3f6421_$LT$impl$u20$f64$GT$8copysign17h5d4e58b1d60a7106E"(double 1.000000e+00, double -1.000000e+00)
  ret void
}

; Function Attrs: nocallback nofree nosync nounwind speculatable willreturn memory(none)
declare double @llvm.copysign.f64(double, double) #2

attributes #0 = { inlinehint nonlazybind uwtable "probe-stack"="inline-asm" "target-cpu"="x86-64" }
attributes #1 = { nonlazybind uwtable "probe-stack"="inline-asm" "target-cpu"="x86-64" }
attributes #2 = { nocallback nofree nosync nounwind speculatable willreturn memory(none) }

!llvm.module.flags = !{!0, !1}
!llvm.ident = !{!2}

!0 = !{i32 8, !"PIC Level", i32 2}
!1 = !{i32 2, !"RtLibUseGOT", i32 1}
!2 = !{!"rustc version 1.87.0 (17067e9ac 2025-05-09)"}
