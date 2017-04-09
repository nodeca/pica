(module
 (import "env" "memoryBase" (global $memoryBase i32))
 (import "env" "memory" (memory $0 256))
 (import "env" "table" (table 0 anyfunc))
 (import "env" "tableBase" (global $tableBase i32))
 (global $STACKTOP (mut i32) (i32.const 0))
 (global $STACK_MAX (mut i32) (i32.const 0))
 (export "_convolve" (func $_convolve))
 (export "__post_instantiate" (func $__post_instantiate))
 (export "runPostSets" (func $runPostSets))
 (export "_convolveHV" (func $_convolveHV))
 (func $_convolve (param $0 i32) (param $1 i32) (param $2 i32) (param $3 i32) (param $4 i32) (param $5 i32)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  (local $9 i32)
  (local $10 i32)
  (local $11 i32)
  (local $12 i32)
  (local $13 i32)
  (local $14 i32)
  (local $15 i32)
  (local $16 i32)
  (local $17 i32)
  (local $18 i32)
  (local $19 i32)
  (local $20 i32)
  (local $21 i32)
  (local $22 i32)
  (if
   (i32.or
    (i32.eqz
     (get_local $3)
    )
    (i32.eqz
     (get_local $4)
    )
   )
   (return)
   (block
    (set_local $20
     (i32.const 0)
    )
    (set_local $12
     (i32.const 0)
    )
   )
  )
  (loop $while-in
   (set_local $15
    (get_local $12)
   )
   (set_local $21
    (i32.const 0)
   )
   (set_local $6
    (i32.const 0)
   )
   (loop $while-in1
    (set_local $11
     (i32.add
      (get_local $6)
      (i32.const 2)
     )
    )
    (set_local $22
     (tee_local $8
      (i32.load16_s
       (i32.add
        (get_local $5)
        (i32.shl
         (i32.add
          (get_local $6)
          (i32.const 1)
         )
         (i32.const 1)
        )
       )
      )
     )
    )
    (set_local $8
     (if i32
      (get_local $8)
      (block i32
       (set_local $10
        (i32.const 0)
       )
       (set_local $13
        (i32.const 0)
       )
       (set_local $8
        (get_local $11)
       )
       (set_local $7
        (get_local $22)
       )
       (set_local $9
        (i32.const 0)
       )
       (set_local $14
        (i32.const 0)
       )
       (set_local $6
        (i32.add
         (i32.load16_s
          (i32.add
           (get_local $5)
           (i32.shl
            (get_local $6)
            (i32.const 1)
           )
          )
         )
         (get_local $20)
        )
       )
       (loop $while-in3
        (set_local $16
         (i32.add
          (get_local $8)
          (i32.const 1)
         )
        )
        (set_local $17
         (i32.add
          (get_local $6)
          (i32.const 1)
         )
        )
        (set_local $6
         (i32.add
          (i32.mul
           (i32.and
            (tee_local $18
             (i32.load
              (i32.add
               (get_local $0)
               (i32.shl
                (get_local $6)
                (i32.const 2)
               )
              )
             )
            )
            (i32.const 255)
           )
           (tee_local $19
            (i32.load16_s
             (i32.add
              (get_local $5)
              (i32.shl
               (get_local $8)
               (i32.const 1)
              )
             )
            )
           )
          )
          (get_local $14)
         )
        )
        (set_local $9
         (i32.add
          (i32.mul
           (i32.and
            (i32.shr_u
             (get_local $18)
             (i32.const 8)
            )
            (i32.const 255)
           )
           (get_local $19)
          )
          (get_local $9)
         )
        )
        (set_local $8
         (i32.add
          (i32.mul
           (i32.and
            (i32.shr_u
             (get_local $18)
             (i32.const 16)
            )
            (i32.const 255)
           )
           (get_local $19)
          )
          (get_local $13)
         )
        )
        (set_local $10
         (i32.add
          (i32.mul
           (i32.shr_u
            (get_local $18)
            (i32.const 24)
           )
           (get_local $19)
          )
          (get_local $10)
         )
        )
        (if
         (tee_local $7
          (i32.add
           (get_local $7)
           (i32.const -1)
          )
         )
         (block
          (set_local $13
           (get_local $8)
          )
          (set_local $8
           (get_local $16)
          )
          (set_local $14
           (get_local $6)
          )
          (set_local $6
           (get_local $17)
          )
          (br $while-in3)
         )
        )
       )
       (set_local $7
        (get_local $8)
       )
       (i32.add
        (get_local $11)
        (get_local $22)
       )
      )
      (block i32
       (set_local $10
        (i32.const 0)
       )
       (set_local $7
        (i32.const 0)
       )
       (set_local $9
        (i32.const 0)
       )
       (set_local $6
        (i32.const 0)
       )
       (get_local $11)
      )
     )
    )
    (set_local $13
     (i32.lt_s
      (tee_local $6
       (i32.shr_s
        (i32.add
         (get_local $6)
         (i32.const 8192)
        )
        (i32.const 14)
       )
      )
      (i32.const 0)
     )
    )
    (set_local $11
     (if i32
      (i32.lt_s
       (get_local $6)
       (i32.const 255)
      )
      (get_local $6)
      (i32.const 255)
     )
    )
    (set_local $14
     (i32.lt_s
      (tee_local $6
       (i32.shr_s
        (i32.add
         (get_local $9)
         (i32.const 8192)
        )
        (i32.const 14)
       )
      )
      (i32.const 0)
     )
    )
    (if
     (i32.ge_s
      (get_local $6)
      (i32.const 255)
     )
     (set_local $6
      (i32.const 255)
     )
    )
    (set_local $16
     (i32.lt_s
      (tee_local $7
       (i32.shr_s
        (i32.add
         (get_local $7)
         (i32.const 8192)
        )
        (i32.const 14)
       )
      )
      (i32.const 0)
     )
    )
    (set_local $9
     (if i32
      (i32.lt_s
       (get_local $7)
       (i32.const 255)
      )
      (get_local $7)
      (i32.const 255)
     )
    )
    (set_local $17
     (i32.lt_s
      (tee_local $7
       (i32.shr_s
        (i32.add
         (get_local $10)
         (i32.const 8192)
        )
        (i32.const 14)
       )
      )
      (i32.const 0)
     )
    )
    (if
     (i32.ge_s
      (get_local $7)
      (i32.const 255)
     )
     (set_local $7
      (i32.const 255)
     )
    )
    (set_local $10
     (i32.and
      (get_local $11)
      (i32.const 255)
     )
    )
    (if
     (get_local $13)
     (set_local $10
      (i32.const 0)
     )
    )
    (set_local $6
     (i32.and
      (i32.shl
       (get_local $6)
       (i32.const 8)
      )
      (i32.const 65280)
     )
    )
    (if
     (get_local $14)
     (set_local $6
      (i32.const 0)
     )
    )
    (set_local $9
     (i32.and
      (i32.shl
       (get_local $9)
       (i32.const 16)
      )
      (i32.const 16711680)
     )
    )
    (set_local $7
     (i32.shl
      (get_local $7)
      (i32.const 24)
     )
    )
    (i32.store
     (i32.add
      (get_local $1)
      (i32.shl
       (get_local $15)
       (i32.const 2)
      )
     )
     (i32.or
      (i32.or
       (i32.or
        (if i32
         (get_local $16)
         (i32.const 0)
         (get_local $9)
        )
        (if i32
         (get_local $17)
         (i32.const 0)
         (get_local $7)
        )
       )
       (get_local $6)
      )
      (get_local $10)
     )
    )
    (set_local $15
     (i32.add
      (get_local $15)
      (get_local $3)
     )
    )
    (if
     (i32.ne
      (tee_local $21
       (i32.add
        (get_local $21)
        (i32.const 1)
       )
      )
      (get_local $4)
     )
     (block
      (set_local $6
       (get_local $8)
      )
      (br $while-in1)
     )
    )
   )
   (set_local $20
    (i32.mul
     (tee_local $12
      (i32.add
       (get_local $12)
       (i32.const 1)
      )
     )
     (get_local $2)
    )
   )
   (br_if $while-in
    (i32.ne
     (get_local $12)
     (get_local $3)
    )
   )
  )
 )
 (func $_convolveHV (param $0 i32) (param $1 i32) (param $2 i32) (param $3 i32) (param $4 i32) (param $5 i32) (param $6 i32)
  (local $7 i32)
  (call $_convolve
   (i32.const 0)
   (tee_local $7
    (get_local $2)
   )
   (get_local $3)
   (get_local $4)
   (get_local $5)
   (get_local $0)
  )
  (call $_convolve
   (get_local $7)
   (i32.const 0)
   (get_local $4)
   (get_local $5)
   (get_local $6)
   (get_local $1)
  )
 )
 (func $runPostSets
  (nop)
 )
 (func $__post_instantiate
  (set_global $STACKTOP
   (get_global $memoryBase)
  )
  (set_global $STACK_MAX
   (i32.add
    (get_global $STACKTOP)
    (i32.const 5242880)
   )
  )
  (call $runPostSets)
 )
)
