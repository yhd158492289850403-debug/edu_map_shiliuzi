/**
 * 打卡页 - 记录点位访问、行为实践、成长感受
 */
const { LOCATIONS } = require('../../data/locations');
const { BEHAVIORS } = require('../../data/behaviors');
const tracker = require('../../utils/tracker');

Page({
  data: {
    statusBarHeight: 44,
    // Form data
    selectedPoint: null,
    selectedBehavior: '',
    rating: '',
    notes: '',
    photos: [],
    // List data
    points: [],
    behaviors: [],
    // UI state
    showPointPicker: false,
    showBehaviorPicker: false,
    submitting: false
  },

  onLoad(options) {
    const windowInfo = wx.getWindowInfo();
    this.setData({ statusBarHeight: windowInfo.statusBarHeight || 44 });

    // Load points and behaviors
    this.setData({
      points: LOCATIONS.map(l => ({
        id: l.id,
        name: l.n,
        district: l.d,
        category: l.c
      })),
      behaviors: Object.keys(BEHAVIORS)
    });

    // If editing existing checkin
    if (options.id) {
      this.loadCheckin(options.id);
    }

    // If coming from recommend page with selected point/behavior
    if (options.point_id) {
      const point = LOCATIONS.find(l => l.id === parseInt(options.point_id));
      if (point) {
        this.setData({ selectedPoint: point });
      }
    }
    if (options.behavior) {
      this.setData({ selectedBehavior: decodeURIComponent(options.behavior) });
    }
  },

  async loadCheckin(id) {
    try {
      const db = wx.cloud.database();
      const { data } = await db.collection('checkins').doc(id).get();
      if (data) {
        this.setData({
          selectedPoint: { id: data.point_id, name: data.point_name },
          selectedBehavior: data.behavior || '',
          rating: data.rating || '',
          notes: data.notes || '',
          photos: data.photos || []
        });
      }
    } catch (err) {
      console.error('Failed to load checkin:', err);
    }
  },

  onShowPointPicker() {
    this.setData({ showPointPicker: true });
  },

  onShowBehaviorPicker() {
    this.setData({ showBehaviorPicker: true });
  },

  onPointSelect(e) {
    const idx = e.currentTarget.dataset.idx;
    const point = this.data.points[idx];
    this.setData({
      selectedPoint: point,
      showPointPicker: false
    });
  },

  onBehaviorSelect(e) {
    const idx = e.currentTarget.dataset.idx;
    const behavior = this.data.behaviors[idx];
    this.setData({
      selectedBehavior: behavior,
      showBehaviorPicker: false
    });
  },

  onClosePickers() {
    this.setData({
      showPointPicker: false,
      showBehaviorPicker: false
    });
  },

  onRatingSelect(e) {
    const rating = e.currentTarget.dataset.rating;
    this.setData({ rating });
  },

  onNotesInput(e) {
    this.setData({ notes: e.detail.value });
  },

  onChoosePhoto() {
    wx.chooseMedia({
      count: 3,
      mediaType: ['image'],
      success: (res) => {
        const newPhotos = res.tempFiles.map(f => f.tempFilePath);
        this.setData({
          photos: [...this.data.photos, ...newPhotos].slice(0, 3)
        });
      }
    });
  },

  onRemovePhoto(e) {
    const idx = e.currentTarget.dataset.idx;
    const photos = [...this.data.photos];
    photos.splice(idx, 1);
    this.setData({ photos });
  },

  async onSubmit() {
    if (!this.data.selectedPoint) {
      wx.showToast({ title: '请选择点位', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    try {
      // 记录打卡行为
      tracker.trackCheckin({
        pointId: this.data.selectedPoint.id,
        pointName: this.data.selectedPoint.name,
        behavior: this.data.selectedBehavior,
        rating: this.data.rating
      });
      
      const db = wx.cloud.database();
      const checkinData = {
        point_id: this.data.selectedPoint.id,
        point_name: this.data.selectedPoint.name,
        behavior: this.data.selectedBehavior,
        rating: this.data.rating,
        notes: this.data.notes,
        photos: this.data.photos,
        date: new Date().toISOString(),
        created_at: new Date()
      };

      // Upload photos if any
      if (this.data.photos.length > 0) {
        const uploadedPhotos = [];
        for (const photo of this.data.photos) {
          const cloudPath = `checkin-photos/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
          const { fileID } = await wx.cloud.uploadFile({
            cloudPath,
            filePath: photo
          });
          uploadedPhotos.push(fileID);
        }
        checkinData.photos = uploadedPhotos;
      }

      // Save to database
      await db.collection('checkins').add({ data: checkinData });

      wx.showToast({ title: '打卡成功！', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      console.error('Failed to submit checkin:', err);
      wx.showToast({ title: '提交失败，请重试', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  onBack() {
    wx.navigateBack({ fail: () => wx.reLaunch({ url: '/pages/index/index' }) });
  }
});
