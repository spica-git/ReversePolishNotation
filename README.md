# Reverse Polish Notation

## Generate rpn exapmle
```javascript:Generate
  rpn.Generate("2*(5 + 7)");
  // => 2 5 7 + *

  rpn.Generate("~-5*4**(0x0f - 12)**2");
  // => 5 _ ~ 4 15 12 - 2 ** ** *
```

## Calculate rpn example
```javascript:Calculate
  rpn("2 5 7 + *");
  // => 24

  rpn.("5_~4 15 12-2** ** *");
  // => 1048576
```

## Add operate function
rpn.SetOperate(name, arity, function)
```javascript:Add operator
  //#Chain method available
  //sign and cosign
  rpn.SetOperate("sin", 1, function(arg1){ return Math.sin(arg1*(Math.PI/180)); })
    .SetOperate("cos", 1, function(arg1){ return Math.cos(arg1*(Math.PI/180)); });

  rpn( rpn.Generate("sin(45 + 45)") );
  // => 1
```

## Supported operator
  \+ - \* / % << >> ~ & ^ |
