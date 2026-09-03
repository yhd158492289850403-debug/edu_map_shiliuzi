Component({
  data: {
    name: '',
    message: '',
    charCount: 0,
    error: '',
    submitting: false,
    submitted: false
  },

  methods: {
    onOverlayTap() {
      this.triggerEvent('close');
    },

    onCancel() {
      this.triggerEvent('close');
    },

    onNameInput(e) {
      this.setData({ name: e.detail.value });
    },

    onMsgInput(e) {
      const message = e.detail.value;
      this.setData({
        message,
        charCount: message.length,
        error: ''
      });
    },

    async onSubmit() {
      const { message, name, submitting } = this.data;

      if (submitting) return;

      if (!message || message.length < 10) {
        this.setData({ error: '反馈内容至少需要10个字' });
        return;
      }

      if (message.length > 500) {
        this.setData({ error: '反馈内容不能超过500个字' });
        return;
      }

      this.setData({ submitting: true, error: '' });

      try {
        const db = wx.cloud.database();
        await db.collection('feedbacks').add({
          data: {
            name: name || '匿名用户',
            message,
            created_at: new Date()
          }
        });

        this.setData({ submitted: true });

        setTimeout(() => {
          this.triggerEvent('close');
        }, 2000);
      } catch (err) {
        console.error('提交反馈失败:', err);
        this.setData({
          error: '提交失败，请重试',
          submitting: false
        });
      }
    }
  }
});
