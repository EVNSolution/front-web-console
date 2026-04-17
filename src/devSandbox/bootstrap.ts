import { isLocalSandboxMode } from './mode';

export async function shouldEnableLocalSandbox(mode = import.meta.env.MODE): Promise<boolean> {
  return isLocalSandboxMode(mode);
}
