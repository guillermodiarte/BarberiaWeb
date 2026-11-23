package com.barbershop.crm.core.database.dao;

import android.database.Cursor;
import android.os.CancellationSignal;
import androidx.annotation.NonNull;
import androidx.room.CoroutinesRoom;
import androidx.room.EntityDeletionOrUpdateAdapter;
import androidx.room.EntityInsertionAdapter;
import androidx.room.RoomDatabase;
import androidx.room.RoomSQLiteQuery;
import androidx.room.SharedSQLiteStatement;
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import com.barbershop.crm.core.database.entities.ServiceRecordEntity;
import com.barbershop.crm.core.database.entities.SyncStatus;
import java.lang.Class;
import java.lang.Exception;
import java.lang.IllegalArgumentException;
import java.lang.Integer;
import java.lang.Long;
import java.lang.Object;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import javax.annotation.processing.Generated;
import kotlin.Unit;
import kotlin.coroutines.Continuation;
import kotlinx.coroutines.flow.Flow;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class ServiceRecordDao_Impl implements ServiceRecordDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<ServiceRecordEntity> __insertionAdapterOfServiceRecordEntity;

  private final EntityDeletionOrUpdateAdapter<ServiceRecordEntity> __deletionAdapterOfServiceRecordEntity;

  private final EntityDeletionOrUpdateAdapter<ServiceRecordEntity> __updateAdapterOfServiceRecordEntity;

  private final SharedSQLiteStatement __preparedStmtOfPurgePendingRecords;

  private final SharedSQLiteStatement __preparedStmtOfClearSyncedRecords;

  public ServiceRecordDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfServiceRecordEntity = new EntityInsertionAdapter<ServiceRecordEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `service_records` (`localId`,`remoteId`,`serviceId`,`serviceName`,`barberId`,`barberName`,`customerId`,`customerName`,`customerPhone`,`price`,`collectedBy`,`paymentMethod`,`notes`,`createdAt`,`syncStatus`) VALUES (nullif(?, 0),?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final ServiceRecordEntity entity) {
        statement.bindLong(1, entity.getLocalId());
        if (entity.getRemoteId() == null) {
          statement.bindNull(2);
        } else {
          statement.bindLong(2, entity.getRemoteId());
        }
        statement.bindLong(3, entity.getServiceId());
        statement.bindString(4, entity.getServiceName());
        statement.bindLong(5, entity.getBarberId());
        statement.bindString(6, entity.getBarberName());
        if (entity.getCustomerId() == null) {
          statement.bindNull(7);
        } else {
          statement.bindLong(7, entity.getCustomerId());
        }
        if (entity.getCustomerName() == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.getCustomerName());
        }
        if (entity.getCustomerPhone() == null) {
          statement.bindNull(9);
        } else {
          statement.bindString(9, entity.getCustomerPhone());
        }
        statement.bindDouble(10, entity.getPrice());
        statement.bindString(11, entity.getCollectedBy());
        statement.bindString(12, entity.getPaymentMethod());
        if (entity.getNotes() == null) {
          statement.bindNull(13);
        } else {
          statement.bindString(13, entity.getNotes());
        }
        statement.bindString(14, entity.getCreatedAt());
        statement.bindString(15, __SyncStatus_enumToString(entity.getSyncStatus()));
      }
    };
    this.__deletionAdapterOfServiceRecordEntity = new EntityDeletionOrUpdateAdapter<ServiceRecordEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "DELETE FROM `service_records` WHERE `localId` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final ServiceRecordEntity entity) {
        statement.bindLong(1, entity.getLocalId());
      }
    };
    this.__updateAdapterOfServiceRecordEntity = new EntityDeletionOrUpdateAdapter<ServiceRecordEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `service_records` SET `localId` = ?,`remoteId` = ?,`serviceId` = ?,`serviceName` = ?,`barberId` = ?,`barberName` = ?,`customerId` = ?,`customerName` = ?,`customerPhone` = ?,`price` = ?,`collectedBy` = ?,`paymentMethod` = ?,`notes` = ?,`createdAt` = ?,`syncStatus` = ? WHERE `localId` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final ServiceRecordEntity entity) {
        statement.bindLong(1, entity.getLocalId());
        if (entity.getRemoteId() == null) {
          statement.bindNull(2);
        } else {
          statement.bindLong(2, entity.getRemoteId());
        }
        statement.bindLong(3, entity.getServiceId());
        statement.bindString(4, entity.getServiceName());
        statement.bindLong(5, entity.getBarberId());
        statement.bindString(6, entity.getBarberName());
        if (entity.getCustomerId() == null) {
          statement.bindNull(7);
        } else {
          statement.bindLong(7, entity.getCustomerId());
        }
        if (entity.getCustomerName() == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.getCustomerName());
        }
        if (entity.getCustomerPhone() == null) {
          statement.bindNull(9);
        } else {
          statement.bindString(9, entity.getCustomerPhone());
        }
        statement.bindDouble(10, entity.getPrice());
        statement.bindString(11, entity.getCollectedBy());
        statement.bindString(12, entity.getPaymentMethod());
        if (entity.getNotes() == null) {
          statement.bindNull(13);
        } else {
          statement.bindString(13, entity.getNotes());
        }
        statement.bindString(14, entity.getCreatedAt());
        statement.bindString(15, __SyncStatus_enumToString(entity.getSyncStatus()));
        statement.bindLong(16, entity.getLocalId());
      }
    };
    this.__preparedStmtOfPurgePendingRecords = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM service_records WHERE syncStatus = 'PENDING_CREATION' OR syncStatus = 'PENDING_DELETE'";
        return _query;
      }
    };
    this.__preparedStmtOfClearSyncedRecords = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM service_records WHERE syncStatus = 'SYNCED'";
        return _query;
      }
    };
  }

  @Override
  public Object insertRecord(final ServiceRecordEntity record,
      final Continuation<? super Long> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Long>() {
      @Override
      @NonNull
      public Long call() throws Exception {
        __db.beginTransaction();
        try {
          final Long _result = __insertionAdapterOfServiceRecordEntity.insertAndReturnId(record);
          __db.setTransactionSuccessful();
          return _result;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object insertAll(final List<ServiceRecordEntity> records,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfServiceRecordEntity.insert(records);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteRecord(final ServiceRecordEntity record,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __deletionAdapterOfServiceRecordEntity.handle(record);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object updateRecord(final ServiceRecordEntity record,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __updateAdapterOfServiceRecordEntity.handle(record);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object purgePendingRecords(final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfPurgePendingRecords.acquire();
        try {
          __db.beginTransaction();
          try {
            _stmt.executeUpdateDelete();
            __db.setTransactionSuccessful();
            return Unit.INSTANCE;
          } finally {
            __db.endTransaction();
          }
        } finally {
          __preparedStmtOfPurgePendingRecords.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Object clearSyncedRecords(final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfClearSyncedRecords.acquire();
        try {
          __db.beginTransaction();
          try {
            _stmt.executeUpdateDelete();
            __db.setTransactionSuccessful();
            return Unit.INSTANCE;
          } finally {
            __db.endTransaction();
          }
        } finally {
          __preparedStmtOfClearSyncedRecords.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<ServiceRecordEntity>> getAllRecords() {
    final String _sql = "SELECT * FROM service_records ORDER BY localId DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"service_records"}, new Callable<List<ServiceRecordEntity>>() {
      @Override
      @NonNull
      public List<ServiceRecordEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfLocalId = CursorUtil.getColumnIndexOrThrow(_cursor, "localId");
          final int _cursorIndexOfRemoteId = CursorUtil.getColumnIndexOrThrow(_cursor, "remoteId");
          final int _cursorIndexOfServiceId = CursorUtil.getColumnIndexOrThrow(_cursor, "serviceId");
          final int _cursorIndexOfServiceName = CursorUtil.getColumnIndexOrThrow(_cursor, "serviceName");
          final int _cursorIndexOfBarberId = CursorUtil.getColumnIndexOrThrow(_cursor, "barberId");
          final int _cursorIndexOfBarberName = CursorUtil.getColumnIndexOrThrow(_cursor, "barberName");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfCustomerName = CursorUtil.getColumnIndexOrThrow(_cursor, "customerName");
          final int _cursorIndexOfCustomerPhone = CursorUtil.getColumnIndexOrThrow(_cursor, "customerPhone");
          final int _cursorIndexOfPrice = CursorUtil.getColumnIndexOrThrow(_cursor, "price");
          final int _cursorIndexOfCollectedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "collectedBy");
          final int _cursorIndexOfPaymentMethod = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentMethod");
          final int _cursorIndexOfNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "notes");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfSyncStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "syncStatus");
          final List<ServiceRecordEntity> _result = new ArrayList<ServiceRecordEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final ServiceRecordEntity _item;
            final long _tmpLocalId;
            _tmpLocalId = _cursor.getLong(_cursorIndexOfLocalId);
            final Integer _tmpRemoteId;
            if (_cursor.isNull(_cursorIndexOfRemoteId)) {
              _tmpRemoteId = null;
            } else {
              _tmpRemoteId = _cursor.getInt(_cursorIndexOfRemoteId);
            }
            final int _tmpServiceId;
            _tmpServiceId = _cursor.getInt(_cursorIndexOfServiceId);
            final String _tmpServiceName;
            _tmpServiceName = _cursor.getString(_cursorIndexOfServiceName);
            final int _tmpBarberId;
            _tmpBarberId = _cursor.getInt(_cursorIndexOfBarberId);
            final String _tmpBarberName;
            _tmpBarberName = _cursor.getString(_cursorIndexOfBarberName);
            final Integer _tmpCustomerId;
            if (_cursor.isNull(_cursorIndexOfCustomerId)) {
              _tmpCustomerId = null;
            } else {
              _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            }
            final String _tmpCustomerName;
            if (_cursor.isNull(_cursorIndexOfCustomerName)) {
              _tmpCustomerName = null;
            } else {
              _tmpCustomerName = _cursor.getString(_cursorIndexOfCustomerName);
            }
            final String _tmpCustomerPhone;
            if (_cursor.isNull(_cursorIndexOfCustomerPhone)) {
              _tmpCustomerPhone = null;
            } else {
              _tmpCustomerPhone = _cursor.getString(_cursorIndexOfCustomerPhone);
            }
            final double _tmpPrice;
            _tmpPrice = _cursor.getDouble(_cursorIndexOfPrice);
            final String _tmpCollectedBy;
            _tmpCollectedBy = _cursor.getString(_cursorIndexOfCollectedBy);
            final String _tmpPaymentMethod;
            _tmpPaymentMethod = _cursor.getString(_cursorIndexOfPaymentMethod);
            final String _tmpNotes;
            if (_cursor.isNull(_cursorIndexOfNotes)) {
              _tmpNotes = null;
            } else {
              _tmpNotes = _cursor.getString(_cursorIndexOfNotes);
            }
            final String _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getString(_cursorIndexOfCreatedAt);
            final SyncStatus _tmpSyncStatus;
            _tmpSyncStatus = __SyncStatus_stringToEnum(_cursor.getString(_cursorIndexOfSyncStatus));
            _item = new ServiceRecordEntity(_tmpLocalId,_tmpRemoteId,_tmpServiceId,_tmpServiceName,_tmpBarberId,_tmpBarberName,_tmpCustomerId,_tmpCustomerName,_tmpCustomerPhone,_tmpPrice,_tmpCollectedBy,_tmpPaymentMethod,_tmpNotes,_tmpCreatedAt,_tmpSyncStatus);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
        }
      }

      @Override
      protected void finalize() {
        _statement.release();
      }
    });
  }

  @Override
  public Object getPendingCreationRecords(
      final Continuation<? super List<ServiceRecordEntity>> $completion) {
    final String _sql = "SELECT * FROM service_records WHERE syncStatus = 'PENDING_CREATION'";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<ServiceRecordEntity>>() {
      @Override
      @NonNull
      public List<ServiceRecordEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfLocalId = CursorUtil.getColumnIndexOrThrow(_cursor, "localId");
          final int _cursorIndexOfRemoteId = CursorUtil.getColumnIndexOrThrow(_cursor, "remoteId");
          final int _cursorIndexOfServiceId = CursorUtil.getColumnIndexOrThrow(_cursor, "serviceId");
          final int _cursorIndexOfServiceName = CursorUtil.getColumnIndexOrThrow(_cursor, "serviceName");
          final int _cursorIndexOfBarberId = CursorUtil.getColumnIndexOrThrow(_cursor, "barberId");
          final int _cursorIndexOfBarberName = CursorUtil.getColumnIndexOrThrow(_cursor, "barberName");
          final int _cursorIndexOfCustomerId = CursorUtil.getColumnIndexOrThrow(_cursor, "customerId");
          final int _cursorIndexOfCustomerName = CursorUtil.getColumnIndexOrThrow(_cursor, "customerName");
          final int _cursorIndexOfCustomerPhone = CursorUtil.getColumnIndexOrThrow(_cursor, "customerPhone");
          final int _cursorIndexOfPrice = CursorUtil.getColumnIndexOrThrow(_cursor, "price");
          final int _cursorIndexOfCollectedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "collectedBy");
          final int _cursorIndexOfPaymentMethod = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentMethod");
          final int _cursorIndexOfNotes = CursorUtil.getColumnIndexOrThrow(_cursor, "notes");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfSyncStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "syncStatus");
          final List<ServiceRecordEntity> _result = new ArrayList<ServiceRecordEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final ServiceRecordEntity _item;
            final long _tmpLocalId;
            _tmpLocalId = _cursor.getLong(_cursorIndexOfLocalId);
            final Integer _tmpRemoteId;
            if (_cursor.isNull(_cursorIndexOfRemoteId)) {
              _tmpRemoteId = null;
            } else {
              _tmpRemoteId = _cursor.getInt(_cursorIndexOfRemoteId);
            }
            final int _tmpServiceId;
            _tmpServiceId = _cursor.getInt(_cursorIndexOfServiceId);
            final String _tmpServiceName;
            _tmpServiceName = _cursor.getString(_cursorIndexOfServiceName);
            final int _tmpBarberId;
            _tmpBarberId = _cursor.getInt(_cursorIndexOfBarberId);
            final String _tmpBarberName;
            _tmpBarberName = _cursor.getString(_cursorIndexOfBarberName);
            final Integer _tmpCustomerId;
            if (_cursor.isNull(_cursorIndexOfCustomerId)) {
              _tmpCustomerId = null;
            } else {
              _tmpCustomerId = _cursor.getInt(_cursorIndexOfCustomerId);
            }
            final String _tmpCustomerName;
            if (_cursor.isNull(_cursorIndexOfCustomerName)) {
              _tmpCustomerName = null;
            } else {
              _tmpCustomerName = _cursor.getString(_cursorIndexOfCustomerName);
            }
            final String _tmpCustomerPhone;
            if (_cursor.isNull(_cursorIndexOfCustomerPhone)) {
              _tmpCustomerPhone = null;
            } else {
              _tmpCustomerPhone = _cursor.getString(_cursorIndexOfCustomerPhone);
            }
            final double _tmpPrice;
            _tmpPrice = _cursor.getDouble(_cursorIndexOfPrice);
            final String _tmpCollectedBy;
            _tmpCollectedBy = _cursor.getString(_cursorIndexOfCollectedBy);
            final String _tmpPaymentMethod;
            _tmpPaymentMethod = _cursor.getString(_cursorIndexOfPaymentMethod);
            final String _tmpNotes;
            if (_cursor.isNull(_cursorIndexOfNotes)) {
              _tmpNotes = null;
            } else {
              _tmpNotes = _cursor.getString(_cursorIndexOfNotes);
            }
            final String _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getString(_cursorIndexOfCreatedAt);
            final SyncStatus _tmpSyncStatus;
            _tmpSyncStatus = __SyncStatus_stringToEnum(_cursor.getString(_cursorIndexOfSyncStatus));
            _item = new ServiceRecordEntity(_tmpLocalId,_tmpRemoteId,_tmpServiceId,_tmpServiceName,_tmpBarberId,_tmpBarberName,_tmpCustomerId,_tmpCustomerName,_tmpCustomerPhone,_tmpPrice,_tmpCollectedBy,_tmpPaymentMethod,_tmpNotes,_tmpCreatedAt,_tmpSyncStatus);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @NonNull
  public static List<Class<?>> getRequiredConverters() {
    return Collections.emptyList();
  }

  private String __SyncStatus_enumToString(@NonNull final SyncStatus _value) {
    switch (_value) {
      case SYNCED: return "SYNCED";
      case PENDING_CREATION: return "PENDING_CREATION";
      case PENDING_UPDATE: return "PENDING_UPDATE";
      case PENDING_DELETE: return "PENDING_DELETE";
      default: throw new IllegalArgumentException("Can't convert enum to string, unknown enum value: " + _value);
    }
  }

  private SyncStatus __SyncStatus_stringToEnum(@NonNull final String _value) {
    switch (_value) {
      case "SYNCED": return SyncStatus.SYNCED;
      case "PENDING_CREATION": return SyncStatus.PENDING_CREATION;
      case "PENDING_UPDATE": return SyncStatus.PENDING_UPDATE;
      case "PENDING_DELETE": return SyncStatus.PENDING_DELETE;
      default: throw new IllegalArgumentException("Can't convert value to enum, unknown value: " + _value);
    }
  }
}
