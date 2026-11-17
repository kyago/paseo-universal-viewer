import { defineTranslations } from "@getpaseo/plugin/client";

export const text = defineTranslations({
  resources: {
    en: {
      textPanel: "Selectable text",
      documentPanel: "Document",
      tooLarge: "Files over 1 MB are not opened here.\nChoose Paseo's own viewer from \"Open with…\" in the tab menu.",
    },
    ko: {
      textPanel: "텍스트 선택",
      documentPanel: "문서",
      tooLarge: "1MB가 넘는 파일은 여기서 열지 않습니다.\n탭 메뉴의 '다음으로 열기…'에서 Paseo 기본 뷰어를 고르세요.",
    },
  },
});
