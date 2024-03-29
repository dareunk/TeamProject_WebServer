module.exports = (sequelize, Sequelize) => {
  const message = sequelize.define("message", {
    messageNo: {
      type: Sequelize.INTEGER,
      primaryKey: true
    },
    date: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    recipient: {
      type: Sequelize.STRING
    },
    sender: {
      type: Sequelize.STRING
    },
    content: {
      type: Sequelize.STRING
    }
  },
  {
    timestamps: false
  });
  return message;
}
