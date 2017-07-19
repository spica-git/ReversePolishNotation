
//-----------------------------------------------------
//◆逆ポーランド記法の計算式生成および計算処理
//・演算機能を定義して拡張することで、独自のスクリプト言語のように使える
//
//◆実装
//	globalに"RPN"を追加。インスタンスを作って使う。
//
//	・オブジェクトメンバー
//	RPN.prototype.Generate -> 逆ポーランド記法の式を作る
//	RPN.prototype.Calculate -> 逆ポーランド記法の式を計算する
//	RPN.prototype.SetOperate -> 演算機能の追加
//	RPN.OperateTable -> 演算子と機能の各種パラメータと処理本体の定義
//
//◆example
//	・一般的な四則演算
//		console.log( (new RPN).Generate("2*(5+7)") )
//			> "2 5 7 + *"
//		console.log( (new RPN).Calculate("2 5 7 + *") )
//			> 24
//	・符合、16進数、単項演算、右結合を含んだ式の計算
//		console.log( (new RPN).Generate("~-5*4**(0x0f-12)**2") )
//			> "5 _ ~ 4 15 12 - 2 ** ** *"
//		console.log( (new RPN).Calculate("5 _ ~ 4 15 12 - 2 ** ** *") )
//			> 1048576
//	・演算機能の拡張
//		サイン値の取得機能を追加
//		(new RPN).SetOperate("sin", 1, function(arg1){ return Math.sin(arg1*(Math.PI/180)); })
//	・拡張した演算機能（サイン）
//		console.log( (new RPN).Generate("sin 90") )
//			> "90 sin"
//		console.log( (new RPN).Generate("sin(90)") )
//			> "90 sin"
//		console.log( (new RPN).Calculate("90 sin") )
//			> 1
//	・拡張した演算機能を関数呼出しっぽい記述で使う
//		console.log( (new RPN).Generate("toNum(toStr(2 + 1) + 0) * merge(3,4)") )
//			> "2 1 + toStr 0 + toNum 3 4 merge *"
//		console.log( (new RPN).Calculate("2 1 + toStr 0 + toNum 3 4 merge *") )
//			> 1020

//global名 "RPN" に機能を追加する
window["RPN"] = 
(function(){
"use strict";

//var rpn = _root["RPN"] = function(){};
//var rpn = function(){};
function rpn(){};
/**
 * @description 計算式から逆ポーランド記法を生成
 * @param {string} exp 計算式
 */
rpn.prototype["Generate"] = function(exp){

	///引数エラー判定
	if(typeof exp !== "string"){ throw new Error("illegal arg type"); }

	var Polish = []; ///parse結果格納用
	var ope_stack = [[]]; ///演算子スタック
	var depth = 0; ///括弧のネスト深度
	var unary = true; //単項演算子チェック（正負符号等）

	do
	{
		//先頭の空白文字とカンマを消去
		exp = exp.replace(/^(\s|,)+/, "");
		if(exp.length === 0){ break; }

		//演算子スタック
		ope_stack[depth] = ope_stack[depth] || [];

		///数値抽出（整数・小数・16進数）
		var g = exp.match(/(^0x[0-9a-f]+)|(^[0-9]+(\.[0-9]+)?)/i);
		if(g != null){
			Polish.push( g[0].indexOf("0x") === 0 ? parseInt(g[0],10) : parseFloat(g[0]));
			exp = exp.substring(g[0].length);
			unary = false;
			continue;
		}

		//演算子抽出
		var op = null;
		for(var key in rpn.OperateTable){
			if(exp.indexOf(key) === 0){
				op = key;
				exp = exp.substring(key.length);
				break;
			}
		}

		if(op == null){
			throw new Error("illegal expression:" + exp.substring(0, 10) + " ...");
		}

		///スタック構築
		///・各演算子の優先順位
		///・符合の単項演算子化
		switch(op){
			default:
				///+符号を#に、-符号を_に置換
				if(unary){
					if(op === "+"){ op = "#"; }
					else if(op === "-"){ op = "_"; }
				}

				//演算子スタックの先頭に格納
				//・演算子がまだスタックにない
				//・演算子スタックの先頭にある演算子より優先度が高い
				//・演算子スタックの先頭にある演算子と優先度が同じでかつ結合法則がright to left
				if( ope_stack[depth].length === 0 ||
						rpn.OperateTable[op].Order > rpn.OperateTable[ope_stack[depth][0]].Order ||
						(rpn.OperateTable[op].Order === rpn.OperateTable[ope_stack[depth][0]].Order
							&& rpn.OperateTable[op].AssocLow==="R")
				){
						ope_stack[depth].unshift(op);
				}
				//式のスタックに演算子を積む
				else{
					//演算子スタックの先頭から、優先順位が同じか高いものを全て抽出して式に積む
					//※優先順位が同じなのは結合法則がright to leftのものだけスタックに積んである
					while( ope_stack[depth].length > 0 ){
						var ope = ope_stack[depth].shift();
						Polish.push( ope );
						//演算優先度が、スタック先頭の演算子以上ならば、続けて式に演算子を積む
						if( rpn.OperateTable[ope].Order >= rpn.OperateTable[op].Order ){
							continue;
						}
						else{
							break;
						}
					}
					ope_stack[depth].unshift(op);
				}
				unary = true;
				break;

			//括弧はネストにするので特別
			case "(":
				depth++;
				unary = true;
				break;

			case ")":
				while(ope_stack[depth].length > 0){ ///演算子スタックを全て処理
					Polish.push( ope_stack[depth].shift() );
				}
				if( --depth < 0 ){
					//括弧閉じ多すぎてエラー
					throw new Error("too much ')'");
				}
				unary = false; ///括弧を閉じた直後は符号（単項演算子）ではない
				break;
		}
	}while(exp.length > 0)

	if(depth > 0){
		console.warn({message:"too much '('", rest_exp: exp});
	}
	else if(exp.length > 0){
		console.warn({message:"generate unifinished", rest_exp: exp});
	}
	else{
		while(ope_stack[depth].length > 0){
			Polish.push( ope_stack[depth].shift() );
		}
		return Polish.join(" ");
	}

	return null;
}


/**
 * @description 逆ポーランド記法の式を計算する
 * @param {string} rpn_exp 計算式
 */
rpn.prototype["Calculate"] = function(rpn_exp){
	///引数エラー判定
	if( !rpn_exp || typeof rpn_exp !== "string" ){ throw new Error("illegal arg type"); }

	//演算子と演算項を切り分けて配列化する。再起するので関数化。
	function fnSplitOperator(_val, _stack){
		if(_val == ""){ return; }

		//演算子判定
		if(rpn.OperateTable[_val] != null){
			_stack.push({value:_val, Type:rpn.OperateTable[_val].Type});
			return;
		}

		//演算子を含む文字列かどうか判定
		for(var op in rpn.OperateTable){
			var piv = _val.indexOf(op);
			if(piv != -1){
				fnSplitOperator(_val.substring(0, piv), _stack);
				fnSplitOperator(_val.substring(piv, piv + op.length), _stack);
				fnSplitOperator(_val.substring(piv + op.length), _stack);
				return;
			}
		}

		//数値
		if(!isNaN(_val)){
			_stack.push({value:_val, Type:"num"});
		}
		//文字列
		else {
			_stack.push({value:_val, Type:"str"});
		}
	};

	//切り分け実行
	//式を空白文字かカンマでセパレートして配列化＆これらデリミタを式から消す副作用
	var rpn_stack = [];
	for(var i=0, rpn_array=rpn_exp.split(/\s+|,/); i < rpn_array.length; i++){
		fnSplitOperator(rpn_array[i], rpn_stack);
	}


	///演算開始
	var calc_stack = []; //演算結果スタック
	while(rpn_stack.length > 0){
		var elem = rpn_stack.shift();
		switch(elem.Type){
			//演算項（数値のparse）
			case "num":
				calc_stack.push(
					elem.value.indexOf("0x") != -1 ? parseInt(elem.value,10) : parseFloat(elem.value)
				);
				break;

			//演算項（文字列）※数値以外のリテラルを扱うような機能は未サポート
			case "str":
				calc_stack.push(elem.value);
				break;

			//制御文 ※計算時にはないはずなのでwarningを出して無視
			case "state":
				console.warn("inclute statement:" + elem.value);
				break;

			//演算子・計算機能
			case "op": case "fn":
				var operate = rpn.OperateTable[elem.value];
				if(operate == null){ throw new Error("not exist operate:" + elem.value); }

				//演算に必要な数だけ演算項を抽出
				var args = [];
				for(var i=0; i < operate.Arity; i++){
					if(calc_stack.length > 0){
						args.unshift(calc_stack.pop());
					}
					else{
						throw new Error("not enough operand");
					}
				}

				//演算を実行して結果をスタックへ戻す
				var res = operate.fn.apply(null, args);
				if(res != null){ calc_stack.push(res); }
				break;
		}
	}

	///途中失敗の判定
	if(rpn_stack.length > 0 || calc_stack.length !== 1){
		console.warn({message:"calculate unfinished", rest_rpn: rpn_stack, result_value: calc_stack});
		return null;
	}

	///計算結果を戻す
	return calc_stack[0];
}



/**
 * @description 演算子・その他演算機能の定義
 * 	Order: 演算の優先順位（MDNの定義に準拠）
 * 		https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
 * 	Arity: 演算項の数
 *	AssocLow: 結合法則（"":なし, "L":左結合(left to right), "R":右結合(right to left)）
 * 	fn: 演算処理
 */
rpn.OperateTable = {
	'(': { Order:20, Type:"state", Arity: 0, AssocLow: "",
			fn: function(){}
		},
	')': { Order:20, Type:"state", Arity: 0, AssocLow: "",
			fn: function(){}
		},
	//+符合の代替
	'#': {Order:16, Type:"op", Arity: 1, AssocLow: "R",
			fn: function(_L){ return _L; }
		},
	//-符合の代替
	'_': {Order:16, Type:"op", Arity: 1, AssocLow: "R",
			fn: function(_L){ return -_L; }
		},
	'~': {Order:16, Type:"op", Arity: 1, AssocLow: "R",
			fn: function(_L){ return ~_L; }
		},
	'**': {Order:15, Type:"op", Arity: 2, AssocLow: "R",
			fn: function(_L, _R){ return _L ** _R; }
		},
	'*': {Order:14, Type:"op", Arity: 2, AssocLow: "L",
			fn: function(_L, _R){ return _L * _R; }	
		},
	'/': {Order:14, Type:"op", Arity: 2, AssocLow: "L",
			fn: function(_L, _R){ return _L / _R; }
		},
	'%': {Order:14, Type:"op", Arity: 2, AssocLow: "L",
			fn: function(_L, _R){ return _L % _R; }
		},
	'+': {Order:13, Type:"op", Arity: 2, AssocLow: "L",
			fn: function(_L, _R){ return _L + _R; }
		},
	'-': {Order:13, Type:"op", Arity: 2, AssocLow: "L",
			fn: function(_L, _R){ return _L - _R; }
		},
	'<<': {Order:12, Type:"op", Arity: 2, AssocLow: "L",
			fn: function(_L, _R){ return _L << _R; }
		},
	'>>': {Order:12, Type:"op", Arity: 2, AssocLow: "L",
			fn: function(_L, _R){ return _L >> _R; }
		},
	'&': {Order:9, Type:"op", Arity: 2, AssocLow: "L",
			fn: function(_L, _R){ return _L & _R; }
		},
	'^': {Order:8, Type:"op", Arity: 2, AssocLow: "L",
			fn: function(_L, _R){ return _L ^ _R; }
		},
	'|': {Order:7, Type:"op", Arity: 2, AssocLow: "L",
			fn: function(_L, _R){ return _L | _R; }
		}
};

/**
 * @description デフォルトサポートの演算子以外の機能追加（差し替え）
 * @param {string} _name Operator name
 * @param {number} _arity Argument num (Operand num)
 * @param {Object} _fn Operator Function
 */
rpn.prototype["SetOperate"] = function(_name, _arity, _fn){
	rpn.OperateTable[_name] = {Order:18, Type:"fn", Arity: _arity, AssocLow: "L", fn: _fn };
	return this;
};

return rpn;
})();