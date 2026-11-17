import { type PluginFilePanelProps, useFileText, useFileUrl } from "@getpaseo/plugin/client";
import { DocumentFrame, Loading } from "@getpaseo/plugin/client/ui";
import { Text, TextInput, View } from "react-native";
import { jsonSegments } from "./json";

// The text view lays out the whole file at once. 1 MiB is also where Paseo's own phone viewer stops highlighting.
const MAX_TEXT_BYTES = 1024 * 1024;
// Each coloured run is a native text fragment; past this size the file stays one plain run.
const MAX_HIGHLIGHT_BYTES = 200 * 1024;

export function SelectableTextPanel(props: PluginFilePanelProps) {
  if (props.file.size > MAX_TEXT_BYTES) {
    return (
      <Notice
        color={props.theme.colors.foregroundMuted}
        message={"1MB가 넘는 파일은 여기서 열지 않습니다.\n탭 메뉴의 '다음으로 열기…'에서 Paseo 기본 뷰어를 고르세요."}
      />
    );
  }
  return <FileText {...props} />;
}

function FileText({ file, theme }: PluginFilePanelProps) {
  const text = useFileText(file);
  if (text.status === "loading") return <Loading />;
  if (text.status === "error") {
    return <Notice color={theme.colors.statusDanger} message={text.error.message} />;
  }
  const highlightsJson = /^jsonl?$/.test(file.extension) && file.size <= MAX_HIGHLIGHT_BYTES;
  // The plugin theme has no syntax colours, so the status colours stand in.
  const colors = {
    // Not the accent: in green themes it sits too close to the string colour.
    key: theme.colors.foreground,
    string: theme.colors.statusSuccess,
    number: theme.colors.statusWarning,
    literal: theme.colors.statusWarning,
    punct: theme.colors.foregroundMuted,
    plain: theme.colors.foreground,
  };
  return (
    // A read-only multiline TextInput is a UITextView, so a long-press starts range selection with handles.
    // <Text selectable> on iOS only offers Copy for the whole Text.
    <TextInput
      multiline
      editable={false}
      // Plain files keep the value prop, the form already confirmed on a phone.
      value={highlightsJson ? undefined : text.text}
      style={{
        flex: 1,
        padding: 12,
        color: theme.colors.foreground,
        fontFamily: "Menlo",
        fontSize: 13,
        lineHeight: 19,
      }}
    >
      {highlightsJson
        ? jsonSegments(text.text).map((segment, index) => (
            <Text key={index} style={{ color: colors[segment.kind] }}>
              {segment.text}
            </Text>
          ))
        : null}
    </TextInput>
  );
}

// Paseo's frame shows the file in the platform's own viewer: the browser's PDF viewer, or the iOS web view.
export function DocumentPanel({ file, theme }: PluginFilePanelProps) {
  const url = useFileUrl(file);
  if (url.status === "loading") return <Loading />;
  if (url.status === "error") {
    return <Notice color={theme.colors.statusDanger} message={url.error.message} />;
  }
  return <DocumentFrame url={url.url} />;
}

// The file tab already paints the theme background behind the panel.
function Notice({ color, message }: { color: string; message: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Text style={{ color, textAlign: "center" }}>{message}</Text>
    </View>
  );
}
