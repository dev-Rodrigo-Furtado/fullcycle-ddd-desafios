import Order from "../../../../domain/checkout/entity/order";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository implements OrderRepositoryInterface {
  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }

  async update(orderUpdated: Order): Promise<void> {
    let orderModel: OrderModel;

    try {
      orderModel = await OrderModel.findOne({
        where: {
          id: orderUpdated.id,
        },
        include: ["items"],
        rejectOnEmpty: true,
      });
    } catch (error) {
      throw new Error(`Order with id ${orderUpdated.id} not found`);
    }

    orderModel.update({
      total: orderUpdated.total(),
    });

    orderUpdated.items
      .filter((orderItem) => {
        for (let orderItemModel of orderModel.items) {
          if (orderItemModel.id == orderItem.id) {
            return false;
          }
        }

        return true;
      })
      .forEach((orderItem) => {
        let orderItemModel = {
          id: orderItem.id,
          product_id: orderItem.productId,
          order_id: orderUpdated.id,
          quantity: orderItem.quantity,
          name: orderItem.name,
          price: orderItem.price,
        };

        OrderItemModel.create(orderItemModel);
      });

    orderModel.items
      .filter((orderModelItem) => {
        for (let orderItem of orderUpdated.items) {
          if (orderModelItem.id == orderItem.id) {
            return false;
          }
        }

        return true;
      })
      .forEach((orderModelItem) => orderModelItem.destroy());
  }

  find(id: string): Promise<Order> {
    throw new Error("Method not implemented.");
  }

  findAll(): Promise<Order[]> {
    throw new Error("Method not implemented.");
  }
}
