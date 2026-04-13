import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import sequelize from '../database/connection';
import sinchronize from '../database/sincronizar';
import '../models';
import { errorHandler } from '../middlewares/errorHandler';
import authRouter        from '../routes/authRoutes';
import estudianteRouter  from '../routes/estudianteRoutes';
import pensumRouter      from '../routes/pensumRoutes';
import cargaDatosRouter  from '../routes/cargaDatosRoutes';
import dashboardRouter   from '../routes/dashboardRoutes';
import gaRouter          from '../routes/gaRoutes';

class Server {
  public app: Application;
  public puerto: string;

  constructor() {
    this.app = express();
    this.puerto = process.env.PORT || '8080';
    this.middlewares();
    this.routes();
    this.dbConnection();
    this.sinchronize();
    this.listen();
    this.app.use(cors({
      origin: ['*'],
      exposedHeaders: ['Authorization', 'authorization'],
    }));
  }

  private middlewares(): void {
    this.app.use(express.json());
    this.app.use(cors());
  }

  private routes(): void {
    this.app.get('/', (req: Request, res: Response) => {
      res.json({ msg: 'api corriendo... 🚀' });
    });
    this.app.use('/api/auth',        authRouter);
    this.app.use('/api/estudiantes', estudianteRouter);
    this.app.use('/api/pensum',      pensumRouter);
    this.app.use('/api/carga-datos', cargaDatosRouter);
    this.app.use('/api/dashboard',   dashboardRouter);
    this.app.use('/api/ga',          gaRouter);
    this.app.use(errorHandler);
  }

  private async sinchronize(): Promise<void> {
    try {
      await sequelize.sync({ alter: true });
      console.log('✅ Modelos sincronizados con la base de datos.');
    } catch (error) {
      console.error('❌ Error al sincronizar los modelos:', error);
    }
  }

  private async dbConnection(): Promise<void> {
    try {
      await sequelize.authenticate();
      console.log('Conectado a la base de datos');
    } catch (error) {
      console.error('Error al conectar con la base de datos:', error);
    }
  }

  private listen(): void {
    this.app.listen(this.puerto, () => {
      console.log(`Servidor corriendo en el puerto localhost:${this.puerto}`);
    });
  }
}

export default Server;
