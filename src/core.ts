export type Region = {
  visible: boolean;
  bottomLeft: { x: number; y: number };
  size: { x: number; y: number };
  domain: string;
  radius: number;
  count: number;
  posFn: string;
  direction: { x: number; y: number };
  color: string;
};
