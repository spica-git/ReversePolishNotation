# Reverse Polish Notation

## Example.1 Generate rpn 
```javascript
  rpn.Generate("2*(5 + 7)");
  // => 2 5 7 + *

  //# repeated multiplication (exponentiation)
  rpn.Generate("4 ** 3 ** 2");
  // => 4 3 2 ** **

  //# menus sign replace to '_'
  rpn.Generate("~-5*4**(0x0f - 12)**2");
  // => 5 _ ~ 4 15 12 - 2 ** ** *
```

## Example.2 Calculate rpn
```javascript
  rpn("2 5 7 + *");
  // => 24

  //# exponentiation peoceeds from right to left
  rpn("4 3 2 ** **");
  // => 262144

  rpn.("5_~4 15 12-2** ** *");
  // => 1048576
```

## Add operate function
rpn.SetOperate(name, arity, function)
```javascript
  //# chain method available
  //# define sine and cosine function
  rpn.SetOperate("sin", 1, function(arg1){ return Math.sin(arg1*(Math.PI/180)); })
    .SetOperate("cos", 1, function(arg1){ return Math.cos(arg1*(Math.PI/180)); });

  rpn.Generate("sin(45 + 45)");
  // => 45 45 + sin
  rpn("45 45 + sin");
  // => 1
```

## Supported operator
  \+ - \* / ** % << >> ~ & ^ |
