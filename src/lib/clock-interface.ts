export type SetAlarmArguments = {
  hour: number;
  minute: number;
  label?: string;
  skipUI?: boolean;
};

export interface ClockInterface {
  setAlarm(arguments_: SetAlarmArguments): Promise<void>;
}
