(module
 (import "env" "memory" (memory $0 1))
 (table 0 anyfunc)
 (export "convolve" (func $convolve))
 (export "convolveHV" (func $convolveHV))
 (func $convolve (param $0 i32) (param $1 i32) (param $2 i32) (param $3 i32) (param $4 i32) (param $5 i32)
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
  (block $label$0
   (br_if $label$0
    (i32.eqz
     (get_local $3)
    )
   )
   (br_if $label$0
    (i32.eqz
     (get_local $4)
    )
   )
   (set_local $6
    (i32.add
     (get_local $5)
     (i32.const 4)
    )
   )
   (set_local $11
    (i32.const 0)
   )
   (set_local $12
    (i32.const 0)
   )
   (loop $label$1
    (set_local $13
     (get_local $12)
    )
    (set_local $14
     (i32.const 0)
    )
    (set_local $9
     (i32.const 0)
    )
    (loop $label$2
     (set_local $7
      (i32.add
       (get_local $9)
       (i32.const 2)
      )
     )
     (block $label$3
      (block $label$4
       (br_if $label$4
        (i32.eqz
         (tee_local $8
          (i32.load16_s
           (i32.add
            (tee_local $10
             (i32.add
              (get_local $5)
              (tee_local $9
               (i32.shl
                (get_local $9)
                (i32.const 1)
               )
              )
             )
            )
            (i32.const 2)
           )
          )
         )
        )
       )
       (set_local $21
        (i32.const 0)
       )
       (set_local $16
        (i32.sub
         (i32.const 0)
         (get_local $8)
        )
       )
       (set_local $15
        (i32.add
         (get_local $6)
         (get_local $9)
        )
       )
       (set_local $17
        (i32.add
         (get_local $0)
         (i32.shl
          (i32.add
           (get_local $11)
           (i32.load16_s
            (get_local $10)
           )
          )
          (i32.const 2)
         )
        )
       )
       (set_local $20
        (i32.const 0)
       )
       (set_local $19
        (i32.const 0)
       )
       (set_local $18
        (i32.const 0)
       )
       (loop $label$5
        (set_local $18
         (i32.add
          (i32.mul
           (i32.shr_u
            (tee_local $9
             (i32.load
              (get_local $17)
             )
            )
            (i32.const 24)
           )
           (tee_local $10
            (i32.load16_s
             (get_local $15)
            )
           )
          )
          (get_local $18)
         )
        )
        (set_local $21
         (i32.add
          (i32.mul
           (i32.and
            (get_local $9)
            (i32.const 255)
           )
           (get_local $10)
          )
          (get_local $21)
         )
        )
        (set_local $19
         (i32.add
          (i32.mul
           (i32.and
            (i32.shr_u
             (get_local $9)
             (i32.const 16)
            )
            (i32.const 255)
           )
           (get_local $10)
          )
          (get_local $19)
         )
        )
        (set_local $20
         (i32.add
          (i32.mul
           (i32.and
            (i32.shr_u
             (get_local $9)
             (i32.const 8)
            )
            (i32.const 255)
           )
           (get_local $10)
          )
          (get_local $20)
         )
        )
        (set_local $15
         (i32.add
          (get_local $15)
          (i32.const 2)
         )
        )
        (set_local $17
         (i32.add
          (get_local $17)
          (i32.const 4)
         )
        )
        (br_if $label$5
         (tee_local $16
          (i32.add
           (get_local $16)
           (i32.const 1)
          )
         )
        )
       )
       (set_local $9
        (i32.add
         (get_local $7)
         (get_local $8)
        )
       )
       (br $label$3)
      )
      (set_local $18
       (i32.const 0)
      )
      (set_local $19
       (i32.const 0)
      )
      (set_local $9
       (get_local $7)
      )
      (set_local $20
       (i32.const 0)
      )
      (set_local $21
       (i32.const 0)
      )
     )
     (i32.store
      (i32.add
       (get_local $1)
       (i32.shl
        (get_local $13)
        (i32.const 2)
       )
      )
      (i32.or
       (i32.or
        (i32.or
         (select
          (i32.and
           (i32.shl
            (select
             (tee_local $10
              (i32.shr_s
               (i32.add
                (get_local $19)
                (i32.const 8192)
               )
               (i32.const 14)
              )
             )
             (i32.const 255)
             (i32.lt_s
              (get_local $10)
              (i32.const 255)
             )
            )
            (i32.const 16)
           )
           (i32.const 16711680)
          )
          (i32.const 0)
          (i32.gt_s
           (get_local $10)
           (i32.const 0)
          )
         )
         (select
          (i32.shl
           (select
            (tee_local $10
             (i32.shr_s
              (i32.add
               (get_local $18)
               (i32.const 8192)
              )
              (i32.const 14)
             )
            )
            (i32.const 255)
            (i32.lt_s
             (get_local $10)
             (i32.const 255)
            )
           )
           (i32.const 24)
          )
          (i32.const 0)
          (i32.gt_s
           (get_local $10)
           (i32.const 0)
          )
         )
        )
        (select
         (i32.and
          (i32.shl
           (select
            (tee_local $10
             (i32.shr_s
              (i32.add
               (get_local $20)
               (i32.const 8192)
              )
              (i32.const 14)
             )
            )
            (i32.const 255)
            (i32.lt_s
             (get_local $10)
             (i32.const 255)
            )
           )
           (i32.const 8)
          )
          (i32.const 65280)
         )
         (i32.const 0)
         (i32.gt_s
          (get_local $10)
          (i32.const 0)
         )
        )
       )
       (select
        (i32.and
         (select
          (tee_local $10
           (i32.shr_s
            (i32.add
             (get_local $21)
             (i32.const 8192)
            )
            (i32.const 14)
           )
          )
          (i32.const 255)
          (i32.lt_s
           (get_local $10)
           (i32.const 255)
          )
         )
         (i32.const 255)
        )
        (i32.const 0)
        (i32.gt_s
         (get_local $10)
         (i32.const 0)
        )
       )
      )
     )
     (set_local $13
      (i32.add
       (get_local $13)
       (get_local $3)
      )
     )
     (br_if $label$2
      (i32.ne
       (tee_local $14
        (i32.add
         (get_local $14)
         (i32.const 1)
        )
       )
       (get_local $4)
      )
     )
    )
    (set_local $11
     (i32.add
      (get_local $11)
      (get_local $2)
     )
    )
    (br_if $label$1
     (i32.ne
      (tee_local $12
       (i32.add
        (get_local $12)
        (i32.const 1)
       )
      )
      (get_local $3)
     )
    )
   )
  )
 )
 (func $convolveHV (param $0 i32) (param $1 i32) (param $2 i32) (param $3 i32) (param $4 i32) (param $5 i32) (param $6 i32)
  (call $convolve
   (i32.const 0)
   (get_local $2)
   (get_local $3)
   (get_local $4)
   (get_local $5)
   (get_local $0)
  )
  (call $convolve
   (get_local $2)
   (i32.const 0)
   (get_local $4)
   (get_local $5)
   (get_local $6)
   (get_local $1)
  )
 )
)
