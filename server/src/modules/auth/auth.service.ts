import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User, UserDocument } from './schemas/user.schema';
import { Token, TokenDocument } from './schemas/token.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
    private jwtService: JwtService,
  ) {}

  async validateAdmin(email: string, password: string) {
    const user = await this.userModel.findOne({ email: email.toLowerCase() });
    if (!user || !user.isAdmin) throw new UnauthorizedException('Invalid credentials');

    const valid = user.passwordHash && await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  private async signAndStore(user: UserDocument, portal: 'ADMIN' | 'APP') {
  const jti = uuidv4();
  const payload = {
    sub: user._id.toString(),
    email: user.email,
    isAdmin: !!user.isAdmin,
    portal,     // NEW: enforce which portal this token is for
    jti,
  };
  const expiresIn = '1h';
  const token = this.jwtService.sign(payload, { expiresIn });
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await this.tokenModel.create({ userId: user._id, jti, expiresAt });
  return { accessToken: token, expiresIn, jti };
}

  async login(user: UserDocument) {
    const jti = uuidv4();
    const payload = { sub: user._id.toString(), email: user.email, isAdmin: true, jti };
    const expiresIn = '1h';
    const token = this.jwtService.sign(payload, { expiresIn });

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.tokenModel.create({ userId: user._id, jti, expiresAt });

    return this.signAndStore(user, 'ADMIN');;
  }

  async logout(jti: string) {
    await this.tokenModel.updateOne({ jti }, { revoked: true });
    return { message: 'Logged out successfully' };
  }
}
