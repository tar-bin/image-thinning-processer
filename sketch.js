function setup() {
    createCanvas(100, 100);
    createFileInput(getFile);
}

function getFile(file) {
    if (file.type == "image") {
        loadImage(file.data, (img) => {
            resizeCanvas(img.width, img.height);
            // グレースケール
            img.filter(GRAY);
            // 線画抽出
            // http://www.mathgram.xyz/entry/cv/contour
            // 白膨張 => 允E��差を取めE=> 反転
            let dilateimg = img.get();
            dilateimg.filter(DILATE);
            dilateimg.filter(DILATE);
            img.blend(dilateimg,
                0, 0, img.width, img.height,
                0, 0, img.width, img.height,
                DIFFERENCE);
            // �E�値匁E
            img.filter(THRESHOLD, 0.1);
            // 細線化
            NWG(img);
            img.filter(INVERT);
            image(img, 0, 0);
        });
    } else {
        print("画像ファイルを選択してください");
    }
}

// the Nagendraprasad-Wang-Gupta thinning algorithm
// https://pdfs.semanticscholar.org/955d/f7f577fb337f12b72989a53f998ffc80ec6a.pdf
function NWG(img) {
    img.loadPixels();
    const width = img.width;
    const hight = img.height;
    const pixels = img.pixels;

    let updateFlag = true;
    let g = 1;
    // 100回、または更新がなくなるまで実行
    while (updateFlag) {
        // 更新フラグ(更新がない場合は終了)
        updateFlag = false;
        // 領域判定用は書き換わらないようにコピー
        const tmpPixels = new Uint8Array(pixels);
        // g
        g = 1 - g;
        // 全ピクセルループ
        for (var y = 1; y < hight-1; y++) {
            for (var x = 1; x < width-1; x++) {
                // ピクセル位置を計算
                var i = (y * width + x) * 4;
                // 白領域のみを判定対象とする
                if (tmpPixels[i]){
                    // | p(7) | p(0) | p(1) |
                    // | p(6) | P    | p(2) |
                    // | p(5) | p(4) | p(3) |

                    // 白 1 : 黒 0
                    const p7 = (tmpPixels[i - width * 4 - 4]) ? 1 : 0;
                    const p0 = (tmpPixels[i - width * 4    ]) ? 1 : 0;
                    const p1 = (tmpPixels[i - width * 4 + 4]) ? 1 : 0;

                    const p6 = (tmpPixels[i             - 4]) ? 1 : 0;
                    const p2 = (tmpPixels[i             + 4]) ? 1 : 0;

                    const p5 = (tmpPixels[i + width * 4 - 4]) ? 1 : 0;
                    const p4 = (tmpPixels[i + width * 4    ]) ? 1 : 0;
                    const p3 = (tmpPixels[i + width * 4 + 4]) ? 1 : 0;

                    // 白の個数を算出
                    let b = p0+p1+p2+p3+p4+p5+p6+p7;
                    if (1 < b && b < 7){
                        // a(p) の計算（隣接する白ピクセルの数)
                        let a = 0;
                        if (!p0 && p1) { a++; }
                        if (!p1 && p2) { a++; }
                        if (!p2 && p3) { a++; }
                        if (!p3 && p4) { a++; }
                        if (!p4 && p5) { a++; }
                        if (!p5 && p6) { a++; }
                        if (!p6 && p7) { a++; }
                        if (!p7 && p0) { a++; }

                        // c(p) の計算
                        let c = 0;
                        if (!p0 && !p1 && !p2 && !p5 && p4 && p6) {
                            c = 1;
                        }
                        else if (!p2 && !p3 && !p4 && !p7 && p0 && p6) {
                            c = 1;
                        }
                        
                        if (a == 1 || c == 1) {
                            // e(p)
                            let e = (p2 + p4) * p0 * p6;
                            // f(p)
                            let f = (p0 + p6) * p4 * p2;
                            // 黒に塗りつぶし
                            if ((g == 0 && e == 0) || (g == 1 && f == 0)) {
                                pixels[i    ] = 0; // R
                                pixels[i + 1] = 0; // G
                                pixels[i + 2] = 0; // B
                                // 更新した場合は継続
                                updateFlag = true;
                            }
                        }
                    }
                }
            }
        }
    }

    img.updatePixels();
};
