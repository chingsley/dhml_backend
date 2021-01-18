import db from '../../database/models';
import AppService from '../app/app.service';

export default class RoleService extends AppService {
  constructor(req, res) {
    super(req, res);
  }

  create = async (newRole) => {
    await this.rejectDuplicateRole(newRole.name);
    return db.Role.create(newRole);
  };

  update = async (id, changes) => {
    await this.rejectDuplicateRole(changes.name);
    const role = await this.findOne(id);
    await role.update(changes);
    return role;
  };

  findOne = async (id) => {
    const role = await this.findBy('id', id);
    if (!role) {
      throw new Error(
        JSON.stringify({
          status: 404,
          err: `no role matches the id of ${id}`,
        })
      );
    }
    return role;
  };

  remove = async (id) => {
    const role = await this.findOne(id);
    await role.destroy();
    return true;
  };

  findBy = (field, value) => {
    return db.Role.findOne({
      where: { [field]: value },
      include: [{ model: db.User, as: 'users' }],
    });
  };

  rejectDuplicateRole = async (roleName) => {
    const role = await this.findBy('name', roleName);
    if (role && `${this.req.params.id}` !== `${role.id}`) {
      throw new Error(
        JSON.stringify({
          status: 409,
          err: `role name ${role.name} already exists. Duplicate name is not allowed`,
        })
      );
    }
  };
}
